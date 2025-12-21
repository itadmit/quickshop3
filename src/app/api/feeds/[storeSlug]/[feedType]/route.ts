import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

interface Product {
  id: number;
  title: string;
  description: string | null;
  handle: string;
  vendor: string | null;
  product_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  images: any[];
  variants: any[];
  tags: string | null;
}

interface Store {
  id: number;
  slug: string;
  name: string;
  currency: string;
  domain: string | null;
}

// GET /api/feeds/[storeSlug]/[feedType] - Generate product feed
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; feedType: string }> }
) {
  try {
    const { storeSlug, feedType } = await params;

    // Get store
    const store = await queryOne<Store>(
      'SELECT id, slug, name, currency, domain FROM stores WHERE slug = $1',
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Get all active products with variants
    const products = await query<Product>(
      `SELECT 
        p.id, p.title, p.description, p.handle, p.vendor, 
        p.product_type, p.status, p.created_at, p.updated_at, p.tags,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', pi.id,
            'src', pi.src,
            'alt', pi.alt,
            'position', pi.position
          ) ORDER BY pi.position)
          FROM product_images pi
          WHERE pi.product_id = p.id), '[]'
        ) as images,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', pv.id,
            'title', pv.title,
            'price', pv.price,
            'compare_at_price', pv.compare_at_price,
            'sku', pv.sku,
            'barcode', pv.barcode,
            'available', pv.available,
            'weight', pv.weight,
            'weight_unit', pv.weight_unit,
            'option1', pv.option1,
            'option2', pv.option2,
            'option3', pv.option3,
            'image_id', pv.image_id
          ) ORDER BY pv.position)
          FROM product_variants pv
          WHERE pv.product_id = p.id), '[]'
        ) as variants
       FROM products p
       WHERE p.store_id = $1 AND p.status = 'active'
       ORDER BY p.id`,
      [store.id]
    );

    const baseUrl = store.domain 
      ? `https://${store.domain}` 
      : `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}/shops/${store.slug}`;

    switch (feedType) {
      case 'facebook':
        return generateFacebookFeed(products, store, baseUrl);
      case 'google':
        return generateGoogleFeed(products, store, baseUrl);
      case 'tiktok':
        return generateTikTokFeed(products, store, baseUrl);
      case 'xml':
        return generateGenericXMLFeed(products, store, baseUrl);
      default:
        return NextResponse.json(
          { error: 'Invalid feed type. Valid types: facebook, google, tiktok, xml' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error generating feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
}

function escapeXml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// Facebook / Meta Catalog Feed (RSS 2.0)
function generateFacebookFeed(products: Product[], store: Store, baseUrl: string): NextResponse {
  const items = products.flatMap(product => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const images = Array.isArray(product.images) ? product.images : [];
    const mainImage = images[0]?.src || '';
    const additionalImages = images.slice(1, 10).map((img: any) => img.src);
    
    // If no variants, create one item
    if (variants.length === 0) {
      return [];
    }

    return variants.map((variant: any) => {
      const price = parseFloat(variant.price || 0);
      const comparePrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      const availability = (variant.available || 0) > 0 ? 'in stock' : 'out of stock';
      const variantTitle = variant.title && variant.title !== 'Default Title' 
        ? `${product.title} - ${variant.title}` 
        : product.title;

      return `    <item>
      <g:id>${product.id}_${variant.id}</g:id>
      <g:title>${escapeXml(variantTitle)}</g:title>
      <g:description>${escapeXml(stripHtml(product.description))}</g:description>
      <g:link>${escapeXml(`${baseUrl}/products/${product.handle}?variant=${variant.id}`)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>
${additionalImages.map((img: string) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n')}
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} ${store.currency || 'ILS'}</g:price>
${comparePrice && comparePrice > price ? `      <g:sale_price>${price.toFixed(2)} ${store.currency || 'ILS'}</g:sale_price>` : ''}
      <g:brand>${escapeXml(product.vendor || store.name)}</g:brand>
      <g:condition>new</g:condition>
${variant.sku ? `      <g:mpn>${escapeXml(variant.sku)}</g:mpn>` : ''}
${variant.barcode ? `      <g:gtin>${escapeXml(variant.barcode)}</g:gtin>` : ''}
${product.product_type ? `      <g:product_type>${escapeXml(product.product_type)}</g:product_type>` : ''}
      <g:item_group_id>${product.id}</g:item_group_id>
${variant.option1 ? `      <g:custom_label_0>${escapeXml(variant.option1)}</g:custom_label_0>` : ''}
${variant.option2 ? `      <g:custom_label_1>${escapeXml(variant.option2)}</g:custom_label_1>` : ''}
    </item>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(store.name)} - Product Catalog</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Product catalog for ${escapeXml(store.name)}</description>
${items.join('\n')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// Google Merchant Center Feed
function generateGoogleFeed(products: Product[], store: Store, baseUrl: string): NextResponse {
  const items = products.flatMap(product => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const images = Array.isArray(product.images) ? product.images : [];
    const mainImage = images[0]?.src || '';
    const additionalImages = images.slice(1, 10).map((img: any) => img.src);
    
    if (variants.length === 0) {
      return [];
    }

    return variants.map((variant: any) => {
      const price = parseFloat(variant.price || 0);
      const comparePrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      const availability = (variant.available || 0) > 0 ? 'in_stock' : 'out_of_stock';
      const variantTitle = variant.title && variant.title !== 'Default Title' 
        ? `${product.title} - ${variant.title}` 
        : product.title;

      return `    <item>
      <g:id>${product.id}_${variant.id}</g:id>
      <g:title>${escapeXml(variantTitle)}</g:title>
      <g:description>${escapeXml(stripHtml(product.description))}</g:description>
      <g:link>${escapeXml(`${baseUrl}/products/${product.handle}?variant=${variant.id}`)}</g:link>
      <g:image_link>${escapeXml(mainImage)}</g:image_link>
${additionalImages.map((img: string) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n')}
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} ${store.currency || 'ILS'}</g:price>
${comparePrice && comparePrice > price ? `      <g:sale_price>${price.toFixed(2)} ${store.currency || 'ILS'}</g:sale_price>` : ''}
      <g:brand>${escapeXml(product.vendor || store.name)}</g:brand>
      <g:condition>new</g:condition>
${variant.sku ? `      <g:mpn>${escapeXml(variant.sku)}</g:mpn>` : ''}
${variant.barcode ? `      <g:gtin>${escapeXml(variant.barcode)}</g:gtin>` : ''}
${product.product_type ? `      <g:google_product_category>${escapeXml(product.product_type)}</g:google_product_category>` : ''}
${product.product_type ? `      <g:product_type>${escapeXml(product.product_type)}</g:product_type>` : ''}
      <g:item_group_id>${product.id}</g:item_group_id>
      <g:identifier_exists>${variant.barcode || variant.sku ? 'true' : 'false'}</g:identifier_exists>
${variant.weight ? `      <g:shipping_weight>${variant.weight} ${variant.weight_unit || 'kg'}</g:shipping_weight>` : ''}
    </item>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(store.name)} - Product Feed</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Google Merchant Center product feed for ${escapeXml(store.name)}</description>
${items.join('\n')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// TikTok Catalog Feed
function generateTikTokFeed(products: Product[], store: Store, baseUrl: string): NextResponse {
  const items = products.flatMap(product => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const images = Array.isArray(product.images) ? product.images : [];
    const mainImage = images[0]?.src || '';
    const additionalImages = images.slice(1, 5).map((img: any) => img.src);
    
    if (variants.length === 0) {
      return [];
    }

    return variants.map((variant: any) => {
      const price = parseFloat(variant.price || 0);
      const comparePrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      const availability = (variant.available || 0) > 0 ? 'in stock' : 'out of stock';
      const variantTitle = variant.title && variant.title !== 'Default Title' 
        ? `${product.title} - ${variant.title}` 
        : product.title;

      return `    <item>
      <sku_id>${product.id}_${variant.id}</sku_id>
      <title>${escapeXml(variantTitle)}</title>
      <description>${escapeXml(stripHtml(product.description))}</description>
      <link>${escapeXml(`${baseUrl}/products/${product.handle}?variant=${variant.id}`)}</link>
      <image_link>${escapeXml(mainImage)}</image_link>
${additionalImages.map((img: string) => `      <additional_image_link>${escapeXml(img)}</additional_image_link>`).join('\n')}
      <availability>${availability}</g:availability>
      <price>${price.toFixed(2)}</price>
      <price_currency>${store.currency || 'ILS'}</price_currency>
${comparePrice && comparePrice > price ? `      <sale_price>${price.toFixed(2)}</sale_price>` : ''}
      <brand>${escapeXml(product.vendor || store.name)}</brand>
      <condition>new</condition>
${variant.barcode ? `      <gtin>${escapeXml(variant.barcode)}</gtin>` : ''}
${variant.sku ? `      <mpn>${escapeXml(variant.sku)}</mpn>` : ''}
      <item_group_id>${product.id}</item_group_id>
${product.product_type ? `      <product_type>${escapeXml(product.product_type)}</product_type>` : ''}
      <inventory>${variant.available || 0}</inventory>
    </item>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
  <title>${escapeXml(store.name)} - TikTok Product Catalog</title>
  <link href="${escapeXml(baseUrl)}" rel="alternate"/>
  <updated>${new Date().toISOString()}</updated>
  <id>${escapeXml(baseUrl)}</id>
${items.join('\n')}
</feed>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// Generic XML Feed
function generateGenericXMLFeed(products: Product[], store: Store, baseUrl: string): NextResponse {
  const items = products.flatMap(product => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const images = Array.isArray(product.images) ? product.images : [];
    const mainImage = images[0]?.src || '';
    
    if (variants.length === 0) {
      return [];
    }

    return variants.map((variant: any) => {
      const price = parseFloat(variant.price || 0);
      const comparePrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null;
      const inStock = (variant.available || 0) > 0;
      const variantTitle = variant.title && variant.title !== 'Default Title' 
        ? `${product.title} - ${variant.title}` 
        : product.title;

      return `    <product>
      <id>${product.id}_${variant.id}</id>
      <product_id>${product.id}</product_id>
      <variant_id>${variant.id}</variant_id>
      <title>${escapeXml(variantTitle)}</title>
      <description>${escapeXml(stripHtml(product.description))}</description>
      <url>${escapeXml(`${baseUrl}/products/${product.handle}?variant=${variant.id}`)}</url>
      <image>${escapeXml(mainImage)}</image>
      <price>${price.toFixed(2)}</price>
      <currency>${store.currency || 'ILS'}</currency>
${comparePrice ? `      <compare_at_price>${comparePrice.toFixed(2)}</compare_at_price>` : ''}
      <in_stock>${inStock}</in_stock>
      <inventory>${variant.available || 0}</inventory>
      <brand>${escapeXml(product.vendor || store.name)}</brand>
${variant.sku ? `      <sku>${escapeXml(variant.sku)}</sku>` : ''}
${variant.barcode ? `      <barcode>${escapeXml(variant.barcode)}</barcode>` : ''}
${product.product_type ? `      <category>${escapeXml(product.product_type)}</category>` : ''}
${product.tags ? `      <tags>${escapeXml(product.tags)}</tags>` : ''}
      <created_at>${product.created_at}</created_at>
      <updated_at>${product.updated_at}</updated_at>
    </product>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <store>
    <name>${escapeXml(store.name)}</name>
    <url>${escapeXml(baseUrl)}</url>
    <currency>${store.currency || 'ILS'}</currency>
  </store>
  <products>
${items.join('\n')}
  </products>
  <generated_at>${new Date().toISOString()}</generated_at>
  <total_products>${items.length}</total_products>
</catalog>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

