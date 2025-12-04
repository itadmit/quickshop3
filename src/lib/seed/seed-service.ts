/**
 * Seed Service
 * שירות ליצירת נתוני דמו ואיפוס נתונים
 */

import { query, queryOne } from '@/lib/db';
import { demoData } from './demo-data';
import { eventBus } from '@/lib/events/eventBus';

export class SeedService {
  constructor(private storeId: number) {}

  /**
   * מוודא שה-store קיים, אם לא - יוצר אותו
   */
  private async ensureStoreExists(): Promise<void> {
    const store = await queryOne<{ id: number }>(
      'SELECT id FROM stores WHERE id = $1',
      [this.storeId]
    );

    if (!store) {
      // Get first store owner or create one
      let owner = await queryOne<{ id: number }>(
        'SELECT id FROM store_owners ORDER BY id ASC LIMIT 1'
      );

      if (!owner) {
        // Create default store owner
        const ownerResult = await queryOne<{ id: number }>(
          `INSERT INTO store_owners (email, name, password_hash, email_verified)
           VALUES ($1, $2, $3, true)
           RETURNING id`,
          ['admin@example.com', 'Admin', '$2a$10$dummyhash'] // Dummy hash, won't be used
        );
        owner = ownerResult!;
      }

      // Set sequence to desired storeId before creating
      await query(`SELECT setval('stores_id_seq', GREATEST($1, COALESCE((SELECT MAX(id) FROM stores), 0)), false)`, [this.storeId - 1]);

      // Create store with the desired id
      const createdStore = await queryOne<{ id: number }>(
        `INSERT INTO stores (id, owner_id, name, myshopify_domain, currency, locale, timezone, plan, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         RETURNING id`,
        [
          this.storeId,
          owner.id,
          'My Store',
          'my-store-12345',
          'ILS',
          'he-IL',
          'Asia/Jerusalem',
          'free'
        ]
      );

      if (createdStore) {
        console.log(`✅ Created store with id ${this.storeId}`);
      }
    }
  }

  /**
   * יוצר את כל נתוני הדמו
   */
  async seedAll() {
    try {
      console.log('🌱 Starting seed process...');
      
      // 0. Ensure store exists
      await this.ensureStoreExists();
      
      // 1. Collections
      console.log('📦 Creating collections...');
      const collectionIds = await this.seedCollections();
      console.log(`✅ Created ${collectionIds.length} collections`);

      // 2. Tags
      console.log('🏷️  Creating tags...');
      const tagIds = await this.seedTags();
      console.log(`✅ Created ${tagIds.length} tags`);

      // 3. Products (עם collections, tags, variants, images)
      console.log('🛍️  Creating products...');
      const productIds = await this.seedProducts(collectionIds, tagIds);
      console.log(`✅ Created ${productIds.length} products`);

      // 4. Customers (עם addresses, tags)
      console.log('👥 Creating customers...');
      const customerIds = await this.seedCustomers();
      console.log(`✅ Created ${customerIds.length} customers`);

      // 5. Orders (עם line items)
      console.log('📋 Creating orders...');
      const ordersCount = demoData.orders.length;
      await this.seedOrders(customerIds, productIds);
      console.log(`✅ Created ${ordersCount} orders`);

      // 6. Discounts
      console.log('💰 Creating discounts...');
      const discountsCount = demoData.discounts.length;
      await this.seedDiscounts();
      console.log(`✅ Created ${discountsCount} discounts`);

      // 7. Shipping Zones
      console.log('🚚 Creating shipping zones...');
      const shippingZonesCount = demoData.shippingZones.length;
      await this.seedShippingZones();
      console.log(`✅ Created ${shippingZonesCount} shipping zones`);

      // 8. Blog Posts
      console.log('📝 Creating blog posts...');
      const blogPostsCount = demoData.blogPosts.length;
      await this.seedBlogPosts();
      console.log(`✅ Created ${blogPostsCount} blog posts`);

      // 9. Pages
      console.log('📄 Creating pages...');
      const pagesCount = demoData.pages.length;
      await this.seedPages();
      console.log(`✅ Created ${pagesCount} pages`);

      console.log('🎉 Seed process completed successfully!');

      return {
        success: true,
        message: 'נתוני הדמו נוצרו בהצלחה',
        stats: {
          collections: collectionIds.length,
          tags: tagIds.length,
          products: productIds.length,
          customers: customerIds.length,
          orders: ordersCount,
          discounts: discountsCount,
          shippingZones: shippingZonesCount,
          blogPosts: blogPostsCount,
          pages: pagesCount,
        },
      };
    } catch (error: any) {
      console.error('Error seeding data:', error);
      throw new Error(`שגיאה ביצירת נתוני דמו: ${error.message}`);
    }
  }

  /**
   * יוצר Collections
   */
  private async seedCollections(): Promise<number[]> {
    const collectionIds: number[] = [];

    for (const collectionData of demoData.collections) {
      // Generate unique handle manually for collections
      const baseHandle = collectionData.handle || collectionData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let handle = baseHandle;
      let counter = 1;
      while (true) {
        const existing = await queryOne<{ id: number }>(
          'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2',
          [this.storeId, handle]
        );
        if (!existing) break;
        handle = `${baseHandle}-${counter}`;
        counter++;
      }
      
      const collection = await queryOne<{ id: number }>(
        `INSERT INTO product_collections (store_id, title, handle, description, published_scope, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now(), now())
         RETURNING id`,
        [
          this.storeId,
          collectionData.title,
          handle,
          collectionData.description || null,
          collectionData.published_scope,
          collectionData.sort_order,
        ]
      );

      if (collection) {
        collectionIds.push(collection.id);
      }
    }

    return collectionIds;
  }

  /**
   * יוצר Tags
   */
  private async seedTags(): Promise<number[]> {
    const tagIds: number[] = [];

    for (const tagName of demoData.tags) {
      const tag = await queryOne<{ id: number }>(
        `INSERT INTO product_tags (store_id, name, created_at)
         VALUES ($1, $2, now())
         ON CONFLICT (store_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [this.storeId, tagName]
      );

      if (tag) {
        tagIds.push(tag.id);
      }
    }

    return tagIds;
  }

  /**
   * יוצר Products עם כל הקשרים
   */
  private async seedProducts(collectionIds: number[], tagIds: number[]): Promise<number[]> {
    const productIds: number[] = [];

    for (const productData of demoData.products) {
      // יצירת המוצר - generate unique handle
      const baseHandle = productData.handle || productData.title.toLowerCase().replace(/[\u0590-\u05FF]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'product';
      let handle = baseHandle;
      let counter = 1;
      while (true) {
        const existing = await queryOne<{ id: number }>(
          'SELECT id FROM products WHERE store_id = $1 AND handle = $2',
          [this.storeId, handle]
        );
        if (!existing) break;
        handle = `${baseHandle}-${counter}`;
        counter++;
      }
      
      const product = await queryOne<{ id: number }>(
        `INSERT INTO products (store_id, title, handle, body_html, vendor, product_type, status, published_scope, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
         RETURNING id`,
        [
          this.storeId,
          productData.title,
          handle,
          productData.body_html || null,
          productData.vendor || null,
          productData.product_type || null,
          productData.status || 'draft',
          productData.published_scope || 'web',
        ]
      );

      if (!product) continue;
      const productId = product.id;
      productIds.push(productId);

      // עדכון SEO fields
      if (productData.seo_title || productData.seo_description) {
        // Note: SEO fields might be stored in meta fields or separate table
        // For now, we'll skip this as it depends on the actual schema
      }

      // הוספת תמונות
      if (productData.images) {
        for (let i = 0; i < productData.images.length; i++) {
          const image = productData.images[i];
          await query(
            `INSERT INTO product_images (product_id, position, src, alt, created_at, updated_at)
             VALUES ($1, $2, $3, $4, now(), now())`,
            [productId, image.position || i + 1, image.src, image.alt || null]
          );
        }
      }

      // הוספת Collections
      if (productData.collections && collectionIds.length > 0) {
        const collectionHandles = productData.collections;
        for (const handle of collectionHandles) {
          const collection = await queryOne<{ id: number }>(
            'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2',
            [this.storeId, handle]
          );
          if (collection) {
            const maxPosition = await queryOne<{ max_position: number }>(
              'SELECT COALESCE(MAX(position), 0) as max_position FROM product_collection_map WHERE collection_id = $1',
              [collection.id]
            );
            await query(
              `INSERT INTO product_collection_map (product_id, collection_id, position)
               VALUES ($1, $2, $3)`,
              [productId, collection.id, (maxPosition?.max_position || 0) + 1]
            );
          }
        }
      }

      // הוספת Tags
      if (productData.tags) {
        for (const tagName of productData.tags) {
          const tag = await queryOne<{ id: number }>(
            'SELECT id FROM product_tags WHERE store_id = $1 AND name = $2',
            [this.storeId, tagName]
          );
          if (tag) {
            await query(
              'INSERT INTO product_tag_map (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [productId, tag.id]
            );
          }
        }
      }

      // הוספת Options ו-Variants
      if (productData.options && productData.options.length > 0) {
        for (let i = 0; i < productData.options.length; i++) {
          const optionData = productData.options[i];
          const option = await queryOne<{ id: number }>(
            `INSERT INTO product_options (product_id, name, position, created_at)
             VALUES ($1, $2, $3, now())
             RETURNING id`,
            [productId, optionData.name, optionData.position || i + 1]
          );

          if (option && optionData.values) {
            for (let j = 0; j < optionData.values.length; j++) {
              const valueData = optionData.values[j];
              await query(
                `INSERT INTO product_option_values (option_id, value, position, created_at)
                 VALUES ($1, $2, $3, now())`,
                [option.id, valueData.value, valueData.position || j + 1]
              );
            }
          }
        }

        // יצירת Variants
        if (productData.variants && productData.variants.length > 0) {
          for (let i = 0; i < productData.variants.length; i++) {
            const variantData = productData.variants[i];
            const variant = await queryOne<{ id: number }>(
              `INSERT INTO product_variants (product_id, price, compare_at_price, sku, 
               taxable, option1, option2, option3, weight, position, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
               RETURNING id`,
              [
                productId,
                variantData.price || productData.price || 0,
                productData.compare_at_price || null,
                variantData.sku || null,
                productData.taxable ?? true,
                variantData.option1 || null,
                ('option2' in variantData ? variantData.option2 : null) || null,
                null, // option3
                productData.weight || null,
                i + 1,
              ]
            );

            if (variant) {
              // יצירת variant_inventory
              await query(
                `INSERT INTO variant_inventory (variant_id, available, committed, created_at, updated_at)
                 VALUES ($1, $2, 0, now(), now())`,
                [variant.id, variantData.inventory_quantity || productData.inventory_quantity || 0]
              );

            }
          }
        } else {
          // אם אין variants, יוצר variant ברירת מחדל
          const defaultVariant = await queryOne<{ id: number }>(
            `INSERT INTO product_variants (product_id, price, compare_at_price, sku, 
             taxable, weight, position, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, 1, now(), now())
             RETURNING id`,
            [
              productId,
              productData.price || 0,
              productData.compare_at_price || null,
              productData.sku || null,
              productData.taxable ?? true,
              productData.weight || null,
            ]
          );

          if (defaultVariant) {
            await query(
              `INSERT INTO variant_inventory (variant_id, available, committed, created_at, updated_at)
               VALUES ($1, $2, 0, now(), now())`,
              [defaultVariant.id, productData.inventory_quantity || 0]
            );
          }
        }
      }

      // Emit event
      await eventBus.emitEvent('product.created', { product: { id: productId } }, {
        store_id: this.storeId,
        source: 'seed',
      });
    }

    return productIds;
  }

  /**
   * יוצר Customers עם addresses ו-tags
   */
  private async seedCustomers(): Promise<number[]> {
    const customerIds: number[] = [];

    for (const customerData of demoData.customers) {
      const customer = await queryOne<{ id: number }>(
        `INSERT INTO customers (store_id, email, first_name, last_name, phone, accepts_marketing, 
         state, verified_email, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
         RETURNING id`,
        [
          this.storeId,
          customerData.email,
          customerData.first_name || null,
          customerData.last_name || null,
          customerData.phone || null,
          customerData.accepts_marketing ?? false,
          customerData.state || 'enabled',
          customerData.verified_email ?? false,
          customerData.tags?.join(', ') || null,
        ]
      );

      if (!customer) continue;
      const customerId = customer.id;
      customerIds.push(customerId);

      // הוספת כתובות
      if (customerData.addresses) {
        for (const addressData of customerData.addresses) {
          await query(
            `INSERT INTO customer_addresses (customer_id, first_name, last_name, address1, city, zip, 
             country, country_code, phone, default_address, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())`,
            [
              customerId,
              addressData.first_name || customerData.first_name || null,
              addressData.last_name || customerData.last_name || null,
              addressData.address1 || null,
              addressData.city || null,
              addressData.zip || null,
              addressData.country || 'ישראל',
              addressData.country_code || 'IL',
              addressData.phone || customerData.phone || null,
              addressData.default_address ?? false,
            ]
          );
        }
      }

      // הוספת Tags
      if (customerData.tags && customerData.tags.length > 0) {
        for (const tagName of customerData.tags) {
          await query(
            'INSERT INTO customer_tag_map (customer_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [customerId, tagName]
          );
        }
      }

      // Emit event
      await eventBus.emitEvent('customer.created', { customer: { id: customerId } }, {
        store_id: this.storeId,
        source: 'seed',
      });
    }

    return customerIds;
  }

  /**
   * יוצר Orders עם line items
   */
  private async seedOrders(customerIds: number[], productIds: number[]): Promise<void> {
    if (customerIds.length === 0 || productIds.length === 0) return;

    for (const orderData of demoData.orders) {
      // מציאת לקוח לפי אימייל
      const customer = await queryOne<{ id: number }>(
        'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
        [this.storeId, orderData.customer_email]
      );

      if (!customer) continue;

      const order = await queryOne<{ id: number; order_number: number }>(
        `INSERT INTO orders (store_id, customer_id, order_name, order_number, financial_status, 
         fulfillment_status, total_price, subtotal_price, total_tax, currency, email, name, 
         created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
         RETURNING id, order_number`,
        [
          this.storeId,
          customer.id,
          orderData.order_name || `#${orderData.order_number}`,
          orderData.order_number,
          orderData.financial_status || 'pending',
          orderData.fulfillment_status || 'unfulfilled',
          orderData.total_price || 0,
          orderData.subtotal_price || orderData.total_price || 0,
          orderData.total_tax || 0,
          orderData.currency || 'ILS',
          orderData.customer_email,
          `${orderData.shipping_address?.first_name || ''} ${orderData.shipping_address?.last_name || ''}`.trim(),
        ]
      );

      if (!order) continue;

      // הוספת כתובת משלוח
      if (orderData.shipping_address) {
        await query(
          `INSERT INTO order_fulfillments (order_id, status, tracking_number, created_at, updated_at)
           VALUES ($1, $2, NULL, now(), now())`,
          [order.id, orderData.fulfillment_status || 'unfulfilled']
        );
      }

      // הוספת line items
      if (orderData.line_items) {
        for (let i = 0; i < orderData.line_items.length; i++) {
          const itemData = orderData.line_items[i];
          
          // מציאת מוצר לפי שם
          const product = await queryOne<{ id: number }>(
            `SELECT id FROM products WHERE store_id = $1 AND title = $2 LIMIT 1`,
            [this.storeId, itemData.title]
          );

          if (product) {
            await query(
              `INSERT INTO order_line_items (order_id, product_id, title, quantity, price, sku, 
               created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
              [
                order.id,
                product.id,
                itemData.title,
                itemData.quantity || 1,
                itemData.price || 0,
                itemData.sku || null,
              ]
            );
          }
        }
      }

      // Emit event
      await eventBus.emitEvent('order.created', { order: { id: order.id } }, {
        store_id: this.storeId,
        source: 'seed',
      });
    }
  }

  /**
   * יוצר Discounts
   */
  private async seedDiscounts(): Promise<void> {
    for (const discountData of demoData.discounts) {
      const data = discountData as any;
      await query(
        `INSERT INTO discount_codes (store_id, code, discount_type, value, minimum_order_amount, 
         usage_limit, usage_count, starts_at, ends_at, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
         ON CONFLICT (store_id, code) DO NOTHING`,
        [
          this.storeId,
          data.code,
          data.type,
          data.value,
          data.minimum_order_amount || data.min_purchase_amount || null,
          data.usage_limit || null,
          data.usage_count || 0,
          data.starts_at || null,
          data.ends_at || null,
          data.is_active ?? true,
        ]
      );
    }
  }

  /**
   * יוצר Shipping Zones
   */
  private async seedShippingZones(): Promise<void> {
    for (const zoneData of demoData.shippingZones) {
      const zone = await queryOne<{ id: number }>(
        `INSERT INTO shipping_zones (store_id, name, countries, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())
         RETURNING id`,
        [this.storeId, zoneData.name, zoneData.countries]
      );

      if (zone && zoneData.rates) {
        for (const rate of zoneData.rates) {
          const rateData = rate as any;
          // Extract delivery days
          const estimatedDays = rateData.estimated_days || rateData.delivery_days_min || null;
          const deliveryDaysMin = rateData.delivery_days_min || estimatedDays || null;
          const deliveryDaysMax = rateData.delivery_days_max || estimatedDays || null;
          
          await query(
            `INSERT INTO shipping_rates (shipping_zone_id, name, price, min_order_subtotal, max_order_subtotal, 
             delivery_days_min, delivery_days_max, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`,
            [
              zone.id,
              rateData.name,
              rateData.price,
              rateData.min_order_subtotal || rateData.min_order_price || null,
              rateData.max_order_subtotal || rateData.max_order_price || null,
              deliveryDaysMin,
              deliveryDaysMax,
            ]
          );
        }
      }
    }
  }

  /**
   * יוצר Blog Posts
   */
  private async seedBlogPosts(): Promise<void> {
    for (const post of demoData.blogPosts) {
      const postData = post as any;
      // Generate unique handle for blog post
      const baseHandle = postData.handle || postData.title.toLowerCase().replace(/[\u0590-\u05FF]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'post';
      let handle = baseHandle;
      let counter = 1;
      while (true) {
        const existing = await queryOne<{ id: number }>(
          'SELECT id FROM blog_posts WHERE store_id = $1 AND handle = $2',
          [this.storeId, handle]
        );
        if (!existing) break;
        handle = `${baseHandle}-${counter}`;
        counter++;
      }
      
      // Convert status to is_published boolean
      const isPublished = (postData.status || postData.is_published) === 'published' || postData.is_published === true;
      
      await query(
        `INSERT INTO blog_posts (store_id, title, handle, body_html, published_at, is_published, 
         meta_title, meta_description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
         ON CONFLICT (store_id, blog_id, handle) DO NOTHING`,
        [
          this.storeId,
          postData.title,
          handle,
          postData.body_html || null,
          postData.published_at || (isPublished ? new Date().toISOString() : null),
          isPublished,
          postData.meta_title || postData.seo_title || null,
          postData.meta_description || postData.seo_description || null,
        ]
      );
    }
  }

  /**
   * יוצר Pages
   */
  private async seedPages(): Promise<void> {
    for (const page of demoData.pages) {
      const pageData = page as any;
      const baseHandle = pageData.handle || pageData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let handle = baseHandle;
      let counter = 1;
      while (true) {
        const existing = await queryOne<{ id: number }>(
          'SELECT id FROM pages WHERE store_id = $1 AND handle = $2',
          [this.storeId, handle]
        );
        if (!existing) break;
        handle = `${baseHandle}-${counter}`;
        counter++;
      }
      
      // Convert status to is_published boolean
      const isPublished = (pageData.status || pageData.is_published) === 'published' || pageData.is_published === true;
      
      await query(
        `INSERT INTO pages (store_id, title, handle, body_html, published_at, is_published, 
         meta_title, meta_description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
         ON CONFLICT (store_id, handle) DO NOTHING`,
        [
          this.storeId,
          pageData.title,
          handle,
          pageData.body_html || null,
          pageData.published_at || (isPublished ? new Date().toISOString() : null),
          isPublished,
          pageData.meta_title || pageData.seo_title || null,
          pageData.meta_description || pageData.seo_description || null,
        ]
      );
    }
  }

  /**
   * מאפס את כל הנתונים של החנות
   */
  async resetStore() {
    try {
      // מחיקת כל הנתונים בסדר הנכון (לפי foreign keys)
      // רק טבלאות שיש להן store_id ישירות
      const tablesWithStoreId = [
        'orders',
        'customers',
        'products',
        'product_tags',
        'product_collections',
        'product_addons',
        'size_charts',
        'discount_codes',
        'shipping_zones',
        'blog_posts',
        'blog_categories',
        'pages',
        'webhook_subscriptions',
        'payment_providers',
        'gift_cards',
        'store_credits',
        'customer_segments',
        'loyalty_program_rules',
        'loyalty_tiers',
        'abandoned_carts',
        'wishlists',
        'analytics_events',
        'analytics_daily',
        'traffic_sources',
        'automations',
        'tracking_pixels',
        'tracking_codes',
        'integrations',
        'system_logs',
        'request_logs',
        'notifications',
        'media_files',
        'popups',
        'navigation_menus',
        'custom_order_statuses',
      ];

      // מחיקת הטבלאות הראשיות - השאר ימחק אוטומטית דרך CASCADE
      for (const table of tablesWithStoreId) {
        try {
          await query(`DELETE FROM ${table} WHERE store_id = $1`, [this.storeId]);
        } catch (error: any) {
          // אם הטבלה לא קיימת או אין store_id, ממשיכים
          console.log(`Skipping table ${table}: ${error.message}`);
        }
      }

      return {
        success: true,
        message: 'כל הנתונים נמחקו בהצלחה',
      };
    } catch (error: any) {
      console.error('Error resetting store:', error);
      throw new Error(`שגיאה באיפוס נתונים: ${error.message}`);
    }
  }
}

