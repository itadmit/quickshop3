/**
 * Seed Service
 * שירות ליצירת נתוני דמו ואיפוס נתונים
 */

import { query, queryOne } from '@/lib/db';
import { demoData } from './demo-data';
import { eventBus } from '@/lib/events/eventBus';
import { NEW_YORK_TEMPLATE } from '@/lib/customizer/templates/new-york';

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

      // 10. Popups
      console.log('🎯 Creating popups...');
      const popupsCount = demoData.popups?.length || 0;
      await this.seedPopups();
      console.log(`✅ Created ${popupsCount} popups`);

      // 11. Automatic Discounts
      console.log('🎁 Creating automatic discounts...');
      const automaticDiscountsCount = demoData.automaticDiscounts?.length || 0;
      await this.seedAutomaticDiscounts(productIds);
      console.log(`✅ Created ${automaticDiscountsCount} automatic discounts`);

      // 12. Gift Cards
      console.log('💳 Creating gift cards...');
      const giftCardsCount = demoData.giftCards?.length || 0;
      await this.seedGiftCards();
      console.log(`✅ Created ${giftCardsCount} gift cards`);

      // 13. Blog Categories
      console.log('📚 Creating blog categories...');
      const blogCategoryIds = await this.seedBlogCategories();
      console.log(`✅ Created ${blogCategoryIds.length} blog categories`);

      // 14. Abandoned Carts
      console.log('🛒 Creating abandoned carts...');
      const abandonedCartsCount = demoData.abandonedCarts?.length || 0;
      await this.seedAbandonedCarts(customerIds);
      console.log(`✅ Created ${abandonedCartsCount} abandoned carts`);

      // 15. Wishlists
      console.log('❤️  Creating wishlists...');
      const wishlistsCount = demoData.wishlists?.length || 0;
      await this.seedWishlists(customerIds, productIds);
      console.log(`✅ Created ${wishlistsCount} wishlists`);

      // 16. Navigation Menus
      console.log('🧭 Creating navigation menus...');
      const navigationMenusCount = demoData.navigationMenus?.length || 0;
      await this.seedNavigationMenus(collectionIds);
      console.log(`✅ Created ${navigationMenusCount} navigation menus`);

      // 17. Product Reviews
      console.log('⭐ Creating product reviews...');
      const reviewsCount = demoData.productReviews?.length || 0;
      await this.seedProductReviews(customerIds, productIds);
      console.log(`✅ Created ${reviewsCount} product reviews`);

      // 18. Store Credits
      console.log('💳 Creating store credits...');
      const storeCreditsCount = demoData.storeCredits?.length || 0;
      await this.seedStoreCredits(customerIds);
      console.log(`✅ Created ${storeCreditsCount} store credits`);

      // 19. Loyalty Program
      console.log('🎁 Creating loyalty program...');
      const loyaltyTiersCount = demoData.loyaltyTiers?.length || 0;
      const loyaltyRulesCount = demoData.loyaltyRules?.length || 0;
      const loyaltyTierIds = await this.seedLoyaltyTiers();
      await this.seedLoyaltyRules();
      await this.seedLoyaltyPoints(customerIds, loyaltyTierIds);
      console.log(`✅ Created ${loyaltyTiersCount} loyalty tiers, ${loyaltyRulesCount} rules, and customer points`);

      // 20. Contacts
      console.log('📇 Creating contacts...');
      const contactsCount = demoData.contacts?.length || 0;
      await this.seedContacts();
      console.log(`✅ Created ${contactsCount} contacts`);

      // 21. Returns
      console.log('↩️  Creating returns...');
      const returnsCount = demoData.returns?.length || 0;
      await this.seedReturns(customerIds);
      console.log(`✅ Created ${returnsCount} returns`);

      // 22. Install New York Template
      console.log('🎨 Installing New York template...');
      await this.installNewYorkTemplate();
      console.log('✅ New York template installed');

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
          popups: popupsCount,
          automaticDiscounts: automaticDiscountsCount,
          giftCards: giftCardsCount,
          blogCategories: blogCategoryIds.length,
          abandonedCarts: abandonedCartsCount,
          wishlists: wishlistsCount,
          navigationMenus: navigationMenusCount,
          productReviews: reviewsCount,
          storeCredits: storeCreditsCount,
          loyaltyTiers: loyaltyTiersCount,
          loyaltyRules: loyaltyRulesCount,
          contacts: contactsCount,
          returns: returnsCount,
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
            await queryOne<{ id: number }>(
              `INSERT INTO product_variants (product_id, price, compare_at_price, sku, 
               taxable, inventory_quantity, option1, option2, option3, weight, position, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
               RETURNING id`,
              [
                productId,
                variantData.price || productData.price || 0,
                productData.compare_at_price || null,
                variantData.sku || null,
                productData.taxable ?? true,
                variantData.inventory_quantity || productData.inventory_quantity || 0,
                variantData.option1 || null,
                ('option2' in variantData ? variantData.option2 : null) || null,
                null, // option3
                productData.weight || null,
                i + 1,
              ]
            );
          }
        } else {
          // אם אין variants, יוצר variant ברירת מחדל
          await queryOne<{ id: number }>(
            `INSERT INTO product_variants (product_id, price, compare_at_price, sku, 
             taxable, inventory_quantity, weight, position, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 1, now(), now())
             RETURNING id`,
            [
              productId,
              productData.price || 0,
              productData.compare_at_price || null,
              productData.sku || null,
              productData.taxable ?? true,
              productData.inventory_quantity || 0,
              productData.weight || null,
            ]
          );
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
   * יוצר Popups
   */
  private async seedPopups(): Promise<void> {
    if (!demoData.popups || demoData.popups.length === 0) return;

    for (const popupData of demoData.popups) {
      await query(
        `INSERT INTO popups (
          store_id, name, title, content_html, trigger_type, trigger_value,
          display_rules, is_active, starts_at, ends_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
        ON CONFLICT DO NOTHING`,
        [
          this.storeId,
          popupData.name,
          popupData.title || null,
          popupData.content_html || null,
          popupData.trigger_type,
          popupData.trigger_value || null,
          popupData.display_rules ? JSON.stringify(popupData.display_rules) : null,
          popupData.is_active ?? true,
          popupData.starts_at || null,
          popupData.ends_at || null,
        ]
      );
    }
  }

  /**
   * יוצר Automatic Discounts (עם אפשרות למתנות אוטומטיות)
   */
  private async seedAutomaticDiscounts(productIds: number[]): Promise<void> {
    if (!demoData.automaticDiscounts || demoData.automaticDiscounts.length === 0) return;

    for (const discountData of demoData.automaticDiscounts) {
      // אם יש gift_product_id, צריך למצוא מוצר מתאים
      // אם gift_product_id הוא null ב-demoData, נשתמש במוצר הראשון (אם יש)
      let giftProductId: number | null = null;
      if ('gift_product_id' in discountData) {
        if (discountData.gift_product_id !== null && discountData.gift_product_id !== undefined) {
          // אם יש ערך ספציפי, נשתמש בו (אבל צריך לוודא שהוא קיים)
          giftProductId = productIds.includes(discountData.gift_product_id) 
            ? discountData.gift_product_id 
            : (productIds.length > 0 ? productIds[0] : null);
        } else if (discountData.name.includes('מתנה') && productIds.length > 0) {
          // אם השם כולל "מתנה" ואין gift_product_id מוגדר, נשתמש במוצר הראשון
          giftProductId = productIds[0];
        }
      }

      const discount = await queryOne<{ id: number }>(
        `INSERT INTO automatic_discounts (
          store_id, name, description, discount_type, value,
          minimum_order_amount, priority, is_active,
          can_combine_with_codes, can_combine_with_other_automatic, max_combined_discounts,
          buy_quantity, get_quantity, get_discount_type, applies_to_same_product,
          gift_product_id, starts_at, ends_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, now(), now())
        RETURNING id`,
        [
          this.storeId,
          discountData.name,
          discountData.description || null,
          discountData.discount_type,
          discountData.value || null,
          discountData.minimum_order_amount || null,
          discountData.priority || 0,
          discountData.is_active ?? true,
          discountData.can_combine_with_codes ?? true,
          discountData.can_combine_with_other_automatic ?? false,
          discountData.max_combined_discounts || 1,
          discountData.buy_quantity || null,
          discountData.get_quantity || null,
          discountData.get_discount_type || null,
          discountData.applies_to_same_product ?? true,
          giftProductId,
          discountData.starts_at || null,
          discountData.ends_at || null,
        ]
      );

      // אם יש product_ids, collection_ids, או tag_names - נוסיף אותם
      if (discount && ('product_ids' in discountData && discountData.product_ids)) {
        for (const productId of discountData.product_ids) {
          if (productIds.includes(productId)) {
            await query(
              'INSERT INTO automatic_discount_products (automatic_discount_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [discount.id, productId]
            );
          }
        }
      }
    }
  }

  /**
   * יוצר Gift Cards
   */
  private async seedGiftCards(): Promise<void> {
    if (!demoData.giftCards || demoData.giftCards.length === 0) return;

    for (const giftCardData of demoData.giftCards) {
      await query(
        `INSERT INTO gift_cards (
          store_id, code, initial_value, current_value, currency,
          expires_at, is_active, note, created_at, updated_at
        )
        VALUES ($1, $2, $3, $3, $4, $5, $6, $7, now(), now())
        ON CONFLICT (store_id, code) DO UPDATE SET
          initial_value = EXCLUDED.initial_value,
          current_value = EXCLUDED.current_value,
          expires_at = EXCLUDED.expires_at,
          is_active = EXCLUDED.is_active,
          note = EXCLUDED.note,
          updated_at = now()`,
        [
          this.storeId,
          giftCardData.code,
          giftCardData.initial_value,
          giftCardData.currency || 'ILS',
          giftCardData.expires_at || null,
          giftCardData.is_active ?? true,
          giftCardData.note || null,
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

  /**
   * יוצר Blog Categories
   */
  private async seedBlogCategories(): Promise<number[]> {
    if (!demoData.blogCategories || demoData.blogCategories.length === 0) return [];

    const categoryIds: number[] = [];

    for (const categoryData of demoData.blogCategories) {
      const baseHandle = categoryData.handle || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let handle = baseHandle;
      let counter = 1;
      while (true) {
        const existing = await queryOne<{ id: number }>(
          'SELECT id FROM blog_categories WHERE store_id = $1 AND handle = $2',
          [this.storeId, handle]
        );
        if (!existing) break;
        handle = `${baseHandle}-${counter}`;
        counter++;
      }

      const category = await queryOne<{ id: number }>(
        `INSERT INTO blog_categories (store_id, blog_id, name, handle, description, created_at)
         VALUES ($1, $2, $3, $4, $5, now())
         RETURNING id`,
        [this.storeId, null, categoryData.name, handle, categoryData.description || null]
      );

      if (category) {
        categoryIds.push(category.id);
      }
    }

    return categoryIds;
  }

  /**
   * יוצר Abandoned Carts
   */
  private async seedAbandonedCarts(customerIds: number[]): Promise<void> {
    if (!demoData.abandonedCarts || demoData.abandonedCarts.length === 0) return;

    for (const cartData of demoData.abandonedCarts) {
      // מציאת לקוח לפי אימייל
      const customer = await queryOne<{ id: number }>(
        'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
        [this.storeId, cartData.email]
      );

      const token = `abandoned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await query(
        `INSERT INTO abandoned_carts (store_id, customer_id, email, token, cart_data, total_price, currency, abandoned_at, last_activity_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, now(), now())`,
        [
          this.storeId,
          customer?.id || null,
          cartData.email,
          token,
          JSON.stringify(cartData.cart_data),
          cartData.total_price || 0,
          'ILS',
          cartData.abandoned_at || new Date().toISOString(),
        ]
      );
    }
  }

  /**
   * יוצר Wishlists
   */
  private async seedWishlists(customerIds: number[], productIds: number[]): Promise<void> {
    if (!demoData.wishlists || demoData.wishlists.length === 0) return;

    for (const wishlistData of demoData.wishlists) {
      // מציאת לקוח לפי אימייל
      const customer = await queryOne<{ id: number }>(
        'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
        [this.storeId, wishlistData.customer_email]
      );

      if (!customer) continue;

      const wishlist = await queryOne<{ id: number }>(
        `INSERT INTO wishlists (store_id, customer_id, name, is_public, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         RETURNING id`,
        [this.storeId, customer.id, wishlistData.name, wishlistData.is_public ?? false]
      );

      if (!wishlist || !wishlistData.items) continue;

      // הוספת פריטים לרשימת המתנה
      for (const itemData of wishlistData.items) {
        const product = await queryOne<{ id: number }>(
          'SELECT id FROM products WHERE store_id = $1 AND title = $2 LIMIT 1',
          [this.storeId, itemData.product_title]
        );

        if (product) {
          // מציאת variant אם יש
          let variantId: number | null = null;
          if (itemData.variant_title && itemData.variant_title !== 'Default') {
            const variant = await queryOne<{ id: number }>(
              'SELECT id FROM product_variants WHERE product_id = $1 AND (option1 = $2 OR option2 = $2 OR option3 = $2) LIMIT 1',
              [product.id, itemData.variant_title]
            );
            variantId = variant?.id || null;
          }

          await query(
            `INSERT INTO wishlist_items (wishlist_id, product_id, variant_id, quantity, note, created_at)
             VALUES ($1, $2, $3, $4, $5, now())
             ON CONFLICT (wishlist_id, product_id, variant_id) DO NOTHING`,
            [wishlist.id, product.id, variantId, itemData.quantity || 1, itemData.note || null]
          );
        }
      }
    }
  }

  /**
   * יוצר Navigation Menus
   */
  private async seedNavigationMenus(collectionIds: number[]): Promise<void> {
    if (!demoData.navigationMenus || demoData.navigationMenus.length === 0) return;

    for (const menuData of demoData.navigationMenus) {
      const baseHandle = menuData.handle || menuData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      let handle = baseHandle;
      let counter = 1;
      while (true) {
        const existing = await queryOne<{ id: number }>(
          'SELECT id FROM navigation_menus WHERE store_id = $1 AND handle = $2',
          [this.storeId, handle]
        );
        if (!existing) break;
        handle = `${baseHandle}-${counter}`;
        counter++;
      }

      const menu = await queryOne<{ id: number }>(
        `INSERT INTO navigation_menus (store_id, name, handle, position, created_at, updated_at)
         VALUES ($1, $2, $3, $4, now(), now())
         RETURNING id`,
        [this.storeId, menuData.name, handle, menuData.position || null]
      );

      if (!menu || !menuData.items) continue;

      // הוספת פריטי תפריט
      for (const itemData of menuData.items) {
        let resourceId: number | null = null;

        if (itemData.type === 'collection' && itemData.resource_handle) {
          const collection = await queryOne<{ id: number }>(
            'SELECT id FROM product_collections WHERE store_id = $1 AND handle = $2',
            [this.storeId, itemData.resource_handle]
          );
          resourceId = collection?.id || null;
        } else if (itemData.type === 'page' && itemData.resource_handle) {
          const page = await queryOne<{ id: number }>(
            'SELECT id FROM pages WHERE store_id = $1 AND handle = $2',
            [this.storeId, itemData.resource_handle]
          );
          resourceId = page?.id || null;
        } else if (itemData.type === 'product' && itemData.resource_handle) {
          const product = await queryOne<{ id: number }>(
            'SELECT id FROM products WHERE store_id = $1 AND handle = $2',
            [this.storeId, itemData.resource_handle]
          );
          resourceId = product?.id || null;
        }

        await query(
          `INSERT INTO navigation_menu_items (menu_id, parent_id, title, url, type, resource_id, position, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
          [
            menu.id,
            itemData.parent_id || null,
            itemData.title,
            itemData.url || null,
            itemData.type,
            resourceId,
            itemData.position || 0,
            itemData.is_active ?? true,
          ]
        );
      }
    }
  }

  /**
   * יוצר Product Reviews
   */
  private async seedProductReviews(customerIds: number[], productIds: number[]): Promise<void> {
    if (!demoData.productReviews || demoData.productReviews.length === 0) return;

    for (const reviewData of demoData.productReviews) {
      // מציאת מוצר לפי שם
      const product = await queryOne<{ id: number }>(
        'SELECT id FROM products WHERE store_id = $1 AND title = $2 LIMIT 1',
        [this.storeId, reviewData.product_title]
      );

      if (!product) continue;

      // מציאת לקוח לפי אימייל
      let customerId: number | null = null;
      if (reviewData.customer_email) {
        const customer = await queryOne<{ id: number }>(
          'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
          [this.storeId, reviewData.customer_email]
        );
        customerId = customer?.id || null;
      }

      await query(
        `INSERT INTO product_reviews (store_id, product_id, customer_id, rating, title, review_text, reviewer_name, reviewer_email, is_verified_purchase, is_approved, is_published, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())`,
        [
          this.storeId,
          product.id,
          customerId,
          reviewData.rating,
          reviewData.title || null,
          reviewData.review_text || null,
          reviewData.reviewer_name || null,
          reviewData.customer_email || null,
          reviewData.is_verified_purchase ?? false,
          reviewData.is_approved ?? false,
          reviewData.is_published ?? false,
        ]
      );
    }
  }

  /**
   * יוצר Store Credits
   */
  private async seedStoreCredits(customerIds: number[]): Promise<void> {
    if (!demoData.storeCredits || demoData.storeCredits.length === 0) return;

    for (const creditData of demoData.storeCredits) {
      // מציאת לקוח לפי אימייל
      const customer = await queryOne<{ id: number }>(
        'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
        [this.storeId, creditData.customer_email]
      );

      if (!customer) continue;

      await query(
        `INSERT INTO store_credits (store_id, customer_id, balance, currency, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, now(), now())
         ON CONFLICT (store_id, customer_id) DO UPDATE SET
           balance = EXCLUDED.balance,
           expires_at = EXCLUDED.expires_at,
           updated_at = now()`,
        [
          this.storeId,
          customer.id,
          creditData.balance,
          creditData.currency || 'ILS',
          creditData.expires_at || null,
        ]
      );
    }
  }

  /**
   * יוצר Loyalty Tiers
   */
  private async seedLoyaltyTiers(): Promise<number[]> {
    if (!demoData.loyaltyTiers || demoData.loyaltyTiers.length === 0) return [];

    const tierIds: number[] = [];

    for (const tierData of demoData.loyaltyTiers) {
      const tier = await queryOne<{ id: number }>(
        `INSERT INTO customer_loyalty_tiers (store_id, name, tier_level, min_points, discount_percentage, benefits, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, now(), now())
         RETURNING id`,
        [
          this.storeId,
          tierData.name,
          tierData.tier_level,
          tierData.min_points,
          tierData.discount_percentage,
          JSON.stringify(tierData.benefits || {}),
        ]
      );

      if (tier) {
        tierIds.push(tier.id);
      }
    }

    return tierIds;
  }

  /**
   * יוצר Loyalty Program Rules
   */
  private async seedLoyaltyRules(): Promise<void> {
    if (!demoData.loyaltyRules || demoData.loyaltyRules.length === 0) return;

    for (const ruleData of demoData.loyaltyRules) {
      await query(
        `INSERT INTO loyalty_program_rules (store_id, name, rule_type, points_amount, conditions, is_active, starts_at, ends_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())`,
        [
          this.storeId,
          ruleData.name,
          ruleData.rule_type,
          ruleData.points_amount,
          JSON.stringify(ruleData.conditions || {}),
          ruleData.is_active ?? true,
          ruleData.starts_at || null,
          ruleData.ends_at || null,
        ]
      );
    }
  }

  /**
   * יוצר Loyalty Points ללקוחות
   */
  private async seedLoyaltyPoints(customerIds: number[], tierIds: number[]): Promise<void> {
    if (customerIds.length === 0 || tierIds.length === 0) return;

    // יצירת נקודות ללקוח הראשון (VIP)
    const firstCustomerId = customerIds[0];
    const firstTierId = tierIds.length > 0 ? tierIds[0] : null;

    const loyaltyPoints = await queryOne<{ id: number }>(
      `INSERT INTO customer_loyalty_points (store_id, customer_id, total_points, available_points, pending_points, tier_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())
       ON CONFLICT (store_id, customer_id) DO UPDATE SET
         total_points = EXCLUDED.total_points,
         available_points = EXCLUDED.available_points,
         tier_id = EXCLUDED.tier_id,
         updated_at = now()
       RETURNING id`,
      [this.storeId, firstCustomerId, 500, 500, 0, firstTierId]
    );

    if (loyaltyPoints) {
      // יצירת תנועת נקודות לדוגמה
      await query(
        `INSERT INTO loyalty_point_transactions (loyalty_points_id, points, transaction_type, description, created_at)
         VALUES ($1, $2, $3, $4, now())`,
        [loyaltyPoints.id, 500, 'earned', 'נקודות התחלתיות']
      );
    }
  }

  /**
   * יוצר Contacts
   */
  private async seedContacts(): Promise<void> {
    if (!demoData.contacts || demoData.contacts.length === 0) return;

    for (const contactData of demoData.contacts) {
      // בדיקה אם יש לקוח עם אותו אימייל
      const customer = await queryOne<{ id: number }>(
        'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
        [this.storeId, contactData.email]
      );

      const contact = await queryOne<{ id: number }>(
        `INSERT INTO contacts (store_id, customer_id, email, first_name, last_name, phone, company, notes, tags, email_marketing_consent, email_marketing_consent_at, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          this.storeId,
          customer?.id || null,
          contactData.email,
          contactData.first_name || null,
          contactData.last_name || null,
          contactData.phone || null,
          contactData.company || null,
          contactData.notes || null,
          contactData.tags || [],
          contactData.email_marketing_consent ?? false,
          contactData.email_marketing_consent ? new Date().toISOString() : null,
          contactData.source || 'manual',
        ]
      );

      // הוספת קטגוריות ליצירת קשר אם יש
      if (contact && contactData.tags && contactData.tags.length > 0) {
        for (const tagName of contactData.tags) {
          const category = await queryOne<{ id: number }>(
            'SELECT id FROM contact_categories WHERE store_id = $1 AND name = $2',
            [this.storeId, tagName]
          );
          if (category) {
            await query(
              'INSERT INTO contact_category_assignments (contact_id, category_id, created_at) VALUES ($1, $2, now()) ON CONFLICT DO NOTHING',
              [contact.id, category.id]
            );
          }
        }
      }
    }
  }

  /**
   * יוצר Returns
   */
  private async seedReturns(customerIds: number[]): Promise<void> {
    if (!demoData.returns || demoData.returns.length === 0) return;

    for (const returnData of demoData.returns) {
      // מציאת הזמנה לפי מספר הזמנה
      const order = await queryOne<{ id: number }>(
        'SELECT id FROM orders WHERE store_id = $1 AND order_number = $2',
        [this.storeId, returnData.order_number]
      );

      if (!order) continue;

      // מציאת לקוח לפי אימייל
      const customer = await queryOne<{ id: number }>(
        'SELECT id FROM customers WHERE store_id = $1 AND email = $2',
        [this.storeId, returnData.customer_email]
      );

      if (!customer) continue;

      await query(
        `INSERT INTO returns (store_id, order_id, customer_id, status, reason, items, refund_amount, refund_method, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
        [
          this.storeId,
          order.id,
          customer.id,
          returnData.status || 'PENDING',
          returnData.reason,
          JSON.stringify(returnData.items || []),
          returnData.refund_amount || null,
          returnData.refund_method || null,
          returnData.notes || null,
        ]
      );
    }
  }

  /**
   * מתקין את תבנית New York לחנות
   */
  private async installNewYorkTemplate(): Promise<void> {
    try {
      // 1. וודא שיש theme_template בשם 'new-york'
      let themeTemplate = await queryOne<{ id: number }>(
        `SELECT id FROM theme_templates WHERE name = 'new-york' LIMIT 1`
      );

      if (!themeTemplate) {
        // צור את theme_template אם לא קיים
        themeTemplate = await queryOne<{ id: number }>(
          `INSERT INTO theme_templates (name, display_name, description, is_default, version)
           VALUES ('new-york', 'ניו יורק', 'תבנית ברירת מחדל מודרנית', true, '1.0.0')
           RETURNING id`
        );
      }

      if (!themeTemplate) {
        throw new Error('Failed to create or find New York theme template');
      }

      const templateId = themeTemplate.id;

      // 2. בדוק אם כבר יש page_layout עבור home page
      const existingLayout = await queryOne<{ id: number }>(
        `SELECT id FROM page_layouts 
         WHERE store_id = $1 AND page_type = 'home' AND page_handle IS NULL`,
        [this.storeId]
      );

      let layoutId: number;

      if (existingLayout) {
        // עדכן את ה-layout הקיים
        layoutId = existingLayout.id;
        await query(
          `UPDATE page_layouts 
           SET template_id = $1, is_published = true, published_at = now(), updated_at = now()
           WHERE id = $2`,
          [templateId, layoutId]
        );
      } else {
        // צור layout חדש
        const newLayout = await queryOne<{ id: number }>(
          `INSERT INTO page_layouts (store_id, template_id, page_type, is_published, published_at)
           VALUES ($1, $2, 'home', true, now())
           RETURNING id`,
          [this.storeId, templateId]
        );

        if (!newLayout) {
          throw new Error('Failed to create page layout');
        }

        layoutId = newLayout.id;
      }

      // 3. מחק סקשנים קיימים (אם יש)
      await query(
        `DELETE FROM page_sections WHERE page_layout_id = $1`,
        [layoutId]
      );

      // 4. הוסף את הסקשנים מהתבנית
      for (let i = 0; i < NEW_YORK_TEMPLATE.sections.length; i++) {
        const section = NEW_YORK_TEMPLATE.sections[i];
        
        // שמור גם את settings וגם את style
        const sectionData = {
          ...section.settings,
          style: section.style || {}
        };
        
        const sectionResult = await queryOne<{ id: number }>(
          `INSERT INTO page_sections 
           (page_layout_id, section_type, section_id, position, is_visible, is_locked, settings_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            layoutId,
            section.type,
            section.id,
            section.order || i,
            section.visible !== false,
            section.locked || false,
            JSON.stringify(sectionData)
          ]
        );

        // הוסף בלוקים אם יש
        if (section.blocks && section.blocks.length > 0 && sectionResult) {
          for (let j = 0; j < section.blocks.length; j++) {
            const block = section.blocks[j];
            // שמור את כל המידע של הבלוק (content, style, settings)
            const blockData = {
              content: block.content || {},
              style: block.style || {},
              settings: block.settings || {}
            };
            await query(
              `INSERT INTO section_blocks 
               (section_id, block_type, block_id, position, settings_json)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                sectionResult.id,
                block.type,
                block.id || `block-${j}`,
                block.position || j,
                JSON.stringify(blockData)
              ]
            );
          }
        }
      }

      // 5. שמור את theme_settings אם יש
      if (NEW_YORK_TEMPLATE.theme_settings) {
        await query(
          `INSERT INTO store_theme_settings (store_id, template_id, published_settings_json, published_at)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (store_id) 
           DO UPDATE SET template_id = $2, published_settings_json = $3, published_at = now(), updated_at = now()`,
          [this.storeId, templateId, JSON.stringify(NEW_YORK_TEMPLATE.theme_settings)]
        );
      }

      console.log(`✅ New York template installed for store ${this.storeId}`);
    } catch (error: any) {
      console.error('Error installing New York template:', error);
      // Don't fail seed if template installation fails
    }
  }
}

