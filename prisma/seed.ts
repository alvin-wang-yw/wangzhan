import { PrismaClient } from "@prisma/client";
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// 使用 bcrypt 哈希密码
async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

async function main() {
  console.log('🌱 开始填充种子数据...');

  // ==================== 1. 用户 ====================
  console.log('  → 创建用户账号...');

  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: adminPassword,
      role: "ADMIN",
      avatar: '',
      phone: '+86 13800138000',
      company: 'Trade Co., Ltd.',
      country: 'China',
    },
  });

  // 普通测试用户
  const userPassword = await hashPassword('user123');
  const testUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: { password: userPassword },
    create: {
      email: 'user@example.com',
      name: 'Test User',
      password: userPassword,
      role: "USER",
      avatar: '',
      phone: '+86 13900139000',
      company: 'Buyer Inc.',
      country: 'United States',
    },
  });

  console.log(`    管理员: admin@example.com / admin123`);
  console.log(`    测试用户: user@example.com / user123`);

  // ==================== 2. 产品分类 ====================
  console.log('  → 创建产品分类...');
  const keyboardsCategory = await prisma.category.upsert({
    where: { slug: 'keyboards' },
    update: {},
    create: {
      name: 'Keyboards',
      slug: 'keyboards',
      description: 'Mechanical keyboards and accessories',
      sortOrder: 1,
      isActive: true,
    },
  });

  const miceCategory = await prisma.category.upsert({
    where: { slug: 'mice' },
    update: {},
    create: {
      name: 'Mice',
      slug: 'mice',
      description: 'Gaming mice and office mice',
      sortOrder: 2,
      isActive: true,
    },
  });

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
      description: 'Mouse pads, keycaps and more',
      sortOrder: 3,
      isActive: true,
    },
  });

  // ==================== 5. 产品标签 ====================
  console.log('  → 创建产品标签...');
  const tagsData = [
    { name: 'Bestseller', slug: 'bestseller' },
    { name: 'New Arrival', slug: 'new-arrival' },
    { name: 'Gaming', slug: 'gaming' },
    { name: 'Wireless', slug: 'wireless' },
    { name: 'Mechanical', slug: 'mechanical' },
    { name: 'RGB', slug: 'rgb' },
  ];

  const tags = await Promise.all(
    tagsData.map((tag) =>
      prisma.productTag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag,
      })
    )
  );

  // ==================== 4. 产品 ====================
  console.log('  → 创建示例产品...');

  const productsData = [
    {
      name: 'Pro Mechanical Keyboard RGB',
      slug: 'pro-mechanical-keyboard-rgb',
      sku: 'KB-PRO-001',
      categoryId: keyboardsCategory.id,
      price: 89.99,
      originalPrice: 119.99,
      costPrice: 45.0,
      stock: 500,
      minOrderQty: 1,
      description:
        'Professional mechanical keyboard with RGB backlighting, hot-swappable switches, and aluminum frame. Perfect for gaming and typing.',
      shortDesc: 'Hot-swappable RGB mechanical keyboard with aluminum frame',
      weight: 0.95,
      dimensions: '440 x 140 x 35 mm',
      status: "ACTIVE",
      featured: true,
      isNew: true,
      seoTitle: 'Pro Mechanical Keyboard RGB | Premium Typing Experience',
      seoDescription:
        'Premium mechanical keyboard with RGB backlight, hot-swappable switches, and durable aluminum frame. Free shipping worldwide.',
      seoKeywords: 'mechanical keyboard, RGB keyboard, gaming keyboard, hot-swappable',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800',
          altText: 'Pro Mechanical Keyboard RGB - Front View',
          isMain: true,
          sortOrder: 1,
        },
        {
          url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800',
          altText: 'Pro Mechanical Keyboard RGB - Side View',
          isMain: false,
          sortOrder: 2,
        },
      ],
      translations: [
        {
          locale: 'zh',
          name: 'Pro 机械键盘 RGB版',
          slug: 'pro-mechanical-keyboard-rgb',
          description:
            '专业机械键盘，配备RGB背光、热插拔轴体和铝合金边框。完美适用于游戏和打字办公。',
          shortDesc: '热插拔RGB机械键盘，铝合金边框',
          seoTitle: 'Pro机械键盘 RGB版 | 优质打字体验',
          seoDescription:
            '高端机械键盘，RGB背光、热插拔轴体、耐用铝合金边框。全球免邮。',
          seoKeywords: '机械键盘, RGB键盘, 游戏键盘, 热插拔',
        },
      ],
      tagSlugs: ['bestseller', 'gaming', 'mechanical', 'rgb'],
    },
    {
      name: 'Wireless Ergonomic Keyboard',
      slug: 'wireless-ergonomic-keyboard',
      sku: 'KB-WL-002',
      categoryId: keyboardsCategory.id,
      price: 69.99,
      originalPrice: null,
      costPrice: 32.0,
      stock: 300,
      minOrderQty: 1,
      description:
        'Wireless ergonomic keyboard with split design, palm rest, and quiet keys. Reduces wrist strain during long work sessions.',
      shortDesc: 'Ergonomic split design wireless keyboard with palm rest',
      weight: 0.82,
      dimensions: '470 x 200 x 40 mm',
      status: "ACTIVE",
      featured: false,
      isNew: false,
      seoTitle: 'Wireless Ergonomic Keyboard | Comfortable Typing',
      seoDescription:
        'Ergonomic wireless keyboard with split design and palm rest. Reduce wrist pain and type comfortably all day.',
      seoKeywords: 'ergonomic keyboard, wireless keyboard, split keyboard',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
          altText: 'Wireless Ergonomic Keyboard',
          isMain: true,
          sortOrder: 1,
        },
      ],
      translations: [
        {
          locale: 'zh',
          name: '无线人体工学键盘',
          slug: 'wireless-ergonomic-keyboard',
          description:
            '无线人体工学键盘，分体式设计，配备掌托和静音按键。长时间工作减少手腕疲劳。',
          shortDesc: '人体工学分体式无线键盘，带掌托',
          seoTitle: '无线人体工学键盘 | 舒适打字体验',
          seoDescription: '人体工学无线键盘，分体设计带掌托。减轻手腕疼痛，全天舒适打字。',
          seoKeywords: '人体工学键盘, 无线键盘, 分体键盘',
        },
      ],
      tagSlugs: ['wireless'],
    },
    {
      name: 'Gaming Pro Mouse 16000 DPI',
      slug: 'gaming-pro-mouse-16000dpi',
      sku: 'MS-PRO-001',
      categoryId: miceCategory.id,
      price: 49.99,
      originalPrice: 69.99,
      costPrice: 22.0,
      stock: 800,
      minOrderQty: 1,
      description:
        'High-precision gaming mouse with 16000 DPI optical sensor, RGB lighting, 8 programmable buttons, and ergonomic design.',
      shortDesc: '16000 DPI RGB gaming mouse with 8 programmable buttons',
      weight: 0.12,
      dimensions: '128 x 67 x 40 mm',
      status: "ACTIVE",
      featured: true,
      isNew: false,
      seoTitle: 'Gaming Pro Mouse 16000 DPI | Precision Gaming',
      seoDescription:
        'Professional gaming mouse with 16000 DPI sensor, RGB lighting and 8 programmable buttons. Free shipping.',
      seoKeywords: 'gaming mouse, RGB mouse, 16000 DPI, programmable buttons',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800',
          altText: 'Gaming Pro Mouse - Top View',
          isMain: true,
          sortOrder: 1,
        },
        {
          url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800',
          altText: 'Gaming Pro Mouse - Side View',
          isMain: false,
          sortOrder: 2,
        },
      ],
      translations: [
        {
          locale: 'zh',
          name: '游戏专业鼠标 16000 DPI',
          slug: 'gaming-pro-mouse-16000dpi',
          description:
            '高精度游戏鼠标，配备16000 DPI光学传感器、RGB灯效、8个可编程按键和人体工学设计。',
          shortDesc: '16000 DPI RGB游戏鼠标，8个可编程按键',
          seoTitle: '游戏专业鼠标 16000 DPI | 精准游戏体验',
          seoDescription: '专业游戏鼠标，16000 DPI传感器，RGB灯效，8个可编程按键。免邮。',
          seoKeywords: '游戏鼠标, RGB鼠标, 16000 DPI, 可编程按键',
        },
      ],
      tagSlugs: ['bestseller', 'gaming', 'rgb'],
    },
    {
      name: 'Wireless Office Mouse Silent',
      slug: 'wireless-office-mouse-silent',
      sku: 'MS-OFF-002',
      categoryId: miceCategory.id,
      price: 24.99,
      originalPrice: null,
      costPrice: 10.0,
      stock: 1200,
      minOrderQty: 1,
      description:
        'Silent wireless mouse perfect for office use. 2.4G wireless connection, 18-month battery life, ergonomic shape.',
      shortDesc: 'Silent click wireless mouse with 18-month battery life',
      weight: 0.075,
      dimensions: '105 x 60 x 35 mm',
      status: "ACTIVE",
      featured: false,
      isNew: true,
      seoTitle: 'Wireless Silent Office Mouse | Quiet Clicking',
      seoDescription:
        'Ultra-quiet wireless office mouse with 18-month battery life. Perfect for office and home use.',
      seoKeywords: 'wireless mouse, silent mouse, office mouse',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
          altText: 'Wireless Office Mouse',
          isMain: true,
          sortOrder: 1,
        },
      ],
      translations: [
        {
          locale: 'zh',
          name: '无线静音办公鼠标',
          slug: 'wireless-office-mouse-silent',
          description:
            '静音无线鼠标，完美适用于办公场景。2.4G无线连接，18个月续航，人体工学造型。',
          shortDesc: '静音按键无线鼠标，18个月超长续航',
          seoTitle: '无线静音办公鼠标 | 安静点击',
          seoDescription: '超静音无线办公鼠标，18个月续航。办公家用两相宜。',
          seoKeywords: '无线鼠标, 静音鼠标, 办公鼠标',
        },
      ],
      tagSlugs: ['wireless', 'new-arrival'],
    },
    {
      name: 'Extended Gaming Mouse Pad RGB',
      slug: 'extended-gaming-mouse-pad-rgb',
      sku: 'ACC-PAD-001',
      categoryId: accessoriesCategory.id,
      price: 29.99,
      originalPrice: 39.99,
      costPrice: 12.0,
      stock: 600,
      minOrderQty: 1,
      description:
        'Large extended RGB gaming mouse pad with 14 lighting modes, non-slip rubber base, and smooth micro-weave cloth surface.',
      shortDesc: 'RGB backlit extended mouse pad with 14 lighting modes',
      weight: 0.6,
      dimensions: '900 x 400 x 4 mm',
      status: "ACTIVE",
      featured: true,
      isNew: false,
      seoTitle: 'Extended RGB Gaming Mouse Pad | Large Size',
      seoDescription:
        'Large RGB gaming mouse pad with 14 lighting modes and non-slip base. Fits keyboard and mouse perfectly.',
      seoKeywords: 'mouse pad, RGB mouse pad, gaming pad, extended pad',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=800',
          altText: 'Extended RGB Gaming Mouse Pad',
          isMain: true,
          sortOrder: 1,
        },
      ],
      translations: [
        {
          locale: 'zh',
          name: '大号游戏鼠标垫 RGB版',
          slug: 'extended-gaming-mouse-pad-rgb',
          description:
            '加大号RGB游戏鼠标垫，14种灯效模式，防滑橡胶底座，精细编织布面。',
          shortDesc: 'RGB背光加大号鼠标垫，14种灯效模式',
          seoTitle: '大号RGB游戏鼠标垫 | 超大尺寸',
          seoDescription: '大号RGB游戏鼠标垫，14种灯效模式，防滑底座。键盘鼠标完美容纳。',
          seoKeywords: '鼠标垫, RGB鼠标垫, 游戏垫, 大号鼠标垫',
        },
      ],
      tagSlugs: ['gaming', 'rgb'],
    },
    {
      name: 'PBT Keycaps Set - 108 Keys',
      slug: 'pbt-keycaps-set-108-keys',
      sku: 'ACC-KC-002',
      categoryId: accessoriesCategory.id,
      price: 39.99,
      originalPrice: null,
      costPrice: 18.0,
      stock: 400,
      minOrderQty: 1,
      description:
        'Premium PBT keycap set with 108 keys, double-shot injection, OEM profile. Compatible with most mechanical keyboards.',
      shortDesc: '108-key double-shot PBT keycaps, OEM profile',
      weight: 0.25,
      dimensions: '180 x 120 x 50 mm',
      status: "ACTIVE",
      featured: false,
      isNew: false,
      seoTitle: 'PBT Keycaps Set 108 Keys | Double-Shot',
      seoDescription:
        'High-quality double-shot PBT keycaps, 108 keys, OEM profile. Upgrade your mechanical keyboard today.',
      seoKeywords: 'keycaps, PBT keycaps, mechanical keyboard, double-shot',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800',
          altText: 'PBT Keycaps Set',
          isMain: true,
          sortOrder: 1,
        },
      ],
      translations: [
        {
          locale: 'zh',
          name: 'PBT键帽套装 - 108键',
          slug: 'pbt-keycaps-set-108-keys',
          description:
            '高品质PBT键帽套装，108键，双色注塑，OEM高度。兼容大多数机械键盘。',
          shortDesc: '108键双色注塑PBT键帽，OEM高度',
          seoTitle: 'PBT键帽套装 108键 | 双色注塑',
          seoDescription: '高品质双色注塑PBT键帽，108键，OEM高度。升级你的机械键盘。',
          seoKeywords: '键帽, PBT键帽, 机械键盘, 双色注塑',
        },
      ],
      tagSlugs: ['mechanical'],
    },
  ];

  for (const p of productsData) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`    跳过已存在产品: ${p.name}`);
      continue;
    }

    console.log(`    创建产品: ${p.name}`);
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        categoryId: p.categoryId,
        price: p.price,
        originalPrice: p.originalPrice,
        costPrice: p.costPrice,
        stock: p.stock,
        minOrderQty: p.minOrderQty,
        description: p.description,
        shortDesc: p.shortDesc,
        weight: p.weight,
        dimensions: p.dimensions,
        status: p.status,
        featured: p.featured,
        isNew: p.isNew,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoKeywords: p.seoKeywords,
        images: {
          create: p.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            isMain: img.isMain,
            sortOrder: img.sortOrder,
          })),
        },
        translations: {
          create: p.translations,
        },
      },
    });

    // 关联标签
    const tagRecords = tags.filter((t) => p.tagSlugs.includes(t.slug));
    for (const tag of tagRecords) {
      await prisma.productTagRelation.create({
        data: {
          productId: product.id,
          tagId: tag.id,
        },
      });
    }
  }

  // ==================== 5. 博客分类 ====================
  console.log('  → 创建博客分类...');
  const blogNews = await prisma.blogCategory.upsert({
    where: { slug: 'news' },
    update: {},
    create: {
      name: 'Industry News',
      slug: 'news',
      description: 'Latest industry news and trends',
      sortOrder: 1,
    },
  });

  const blogGuides = await prisma.blogCategory.upsert({
    where: { slug: 'guides' },
    update: {},
    create: {
      name: 'Buying Guides',
      slug: 'guides',
      description: 'Helpful buying guides and product reviews',
      sortOrder: 2,
    },
  });

  const blogTips = await prisma.blogCategory.upsert({
    where: { slug: 'tips' },
    update: {},
    create: {
      name: 'Tips & Tutorials',
      slug: 'tips',
      description: 'Product tips, tutorials and how-to guides',
      sortOrder: 3,
    },
  });

  const blogCompany = await prisma.blogCategory.upsert({
    where: { slug: 'company' },
    update: {},
    create: {
      name: 'Company News',
      slug: 'company',
      description: 'Company updates, announcements and events',
      sortOrder: 4,
    },
  });

  // ==================== 5.1 博客标签 ====================
  console.log('  → 创建博客标签...');
  const blogTagsData = [
    { name: 'Mechanical Keyboard', slug: 'mechanical-keyboard' },
    { name: 'Gaming Mouse', slug: 'gaming-mouse' },
    { name: 'Gaming Setup', slug: 'gaming-setup' },
    { name: 'Product Review', slug: 'product-review' },
    { name: 'Buying Guide', slug: 'buying-guide' },
    { name: 'Tech News', slug: 'tech-news' },
    { name: 'Office Productivity', slug: 'office-productivity' },
    { name: 'Wholesale', slug: 'wholesale' },
  ];

  const blogTags = await Promise.all(
    blogTagsData.map((tag) =>
      prisma.blogTag.upsert({
        where: { slug: tag.slug },
        update: {},
        create: tag,
      })
    )
  );

  // ==================== 6. 博客文章 ====================
  console.log('  → 创建博客文章...');
  const blogPostsData = [
    {
      title: 'Top 10 Mechanical Keyboards of 2024 - Ultimate Buying Guide',
      slug: 'top-10-mechanical-keyboards-2024',
      content: `# Top 10 Mechanical Keyboards of 2024

Choosing the right mechanical keyboard can make a huge difference in your daily productivity and gaming experience. In this comprehensive guide, we'll review the top 10 mechanical keyboards available in 2024.

## What to Look For

- **Switch Type**: Cherry MX, Gateron, Kailh, or custom switches
- **Build Quality**: Aluminum vs plastic frame
- **Features**: RGB, wireless, hot-swappable
- **Layout**: Full-size, TKL, 75%, 65%, 60%

## Our Top Picks

### 1. Pro Mechanical Keyboard RGB
Our top pick for the best all-around mechanical keyboard. Featuring hot-swappable switches, RGB backlighting, and a premium aluminum frame.

### 2. Wireless Ergonomic Keyboard
Best ergonomic option for those who type for long hours.

... [更多内容]

## Conclusion
The best mechanical keyboard depends on your specific needs and budget. Consider what features matter most to you before making a purchase.`,
      excerpt:
        'A comprehensive guide to the best mechanical keyboards of 2024. Find the perfect keyboard for gaming, work, or both.',
      coverImage:
        'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1200',
      categoryId: blogGuides.id,
      author: 'Admin',
      seoTitle: 'Top 10 Mechanical Keyboards 2024 | Buying Guide',
      seoDescription:
        'Read our ultimate guide to the best mechanical keyboards of 2024. Compare features, prices, and find your perfect match.',
      seoKeywords: 'mechanical keyboard buying guide, best keyboard 2024',
    },
    {
      title: 'How to Choose the Right Gaming Mouse for Your Playstyle',
      slug: 'how-to-choose-gaming-mouse',
      content: `# How to Choose the Right Gaming Mouse

With so many gaming mice on the market, finding the perfect one for your playstyle can be overwhelming. This guide will help you make an informed decision.

## Key Factors to Consider

### 1. Sensor Quality
A high-quality sensor is essential for precise aiming. Look for mice with at least 8000 DPI and low lift-off distance.

### 2. Weight
- **Lightweight mice** (under 80g): Best for FPS games and fast movements
- **Medium weight** (80-100g): Versatile, good for most gaming types
- **Heavier mice** (over 100g): Better for precision and stability

### 3. Ergonomics
Consider the grip style you use:
- Palm grip
- Claw grip
- Fingertip grip

### 4. Buttons
The number of programmable buttons depends on the games you play.

## Recommendations

### For FPS Gaming
Our Gaming Pro Mouse with 16000 DPI sensor is an excellent choice for competitive FPS players.

### For MMO/MOBA
Look for mice with more programmable buttons.

... [更多内容]`,
      excerpt:
        'Learn how to choose the perfect gaming mouse based on your playstyle, grip, and favorite games.',
      coverImage:
        'https://images.unsplash.com/photo-1527814050087-3793815479db?w=1200',
      categoryId: blogGuides.id,
      author: 'Admin',
      seoTitle: 'Gaming Mouse Buying Guide | Find Your Perfect Mouse',
      seoDescription:
        'Complete guide to choosing a gaming mouse. Learn about sensors, weight, ergonomics, and which mouse fits your playstyle best.',
      seoKeywords: 'gaming mouse guide, how to choose gaming mouse',
    },
  ];

  for (const post of blogPostsData) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`    跳过已存在博客: ${post.title}`);
      continue;
    }
    console.log(`    创建博客: ${post.title}`);
    const createdPost = await prisma.blogPost.create({ data: post });

    // 自动分配标签
    const tagMap: Record<string, string[]> = {
      'top-10-mechanical-keyboards-2024': ['mechanical-keyboard', 'buying-guide', 'product-review'],
      'how-to-choose-gaming-mouse': ['gaming-mouse', 'buying-guide', 'gaming-setup'],
    };
    const tagSlugs = tagMap[post.slug] || [];
    for (const slug of tagSlugs) {
      const tag = blogTags.find((t) => t.slug === slug);
      if (tag) {
        await prisma.blogPostTagRelation.create({
          data: { postId: createdPost.id, tagId: tag.id },
        });
      }
    }
  }

  // 补充更多博客文章
  console.log('  → 创建更多博客文章...');
  const extraBlogPosts = [
    {
      title: 'How to Clean and Maintain Your Mechanical Keyboard',
      slug: 'clean-maintain-mechanical-keyboard',
      content: `# How to Clean and Maintain Your Mechanical Keyboard

A mechanical keyboard is a significant investment. With proper care and maintenance, it can last for decades. In this guide, we'll walk you through everything you need to know.

## Why Regular Maintenance Matters

Mechanical keyboards are durable, but dust, crumbs, and oils from your fingers can build up over time and affect performance.

## What You'll Need

- Keycap puller
- Soft bristle brush
- Isopropyl alcohol (70%+)
- Microfiber cloth
- Compressed air (optional)

## Step-by-Step Cleaning Guide

### 1. Unplug and Prepare
Turn off your computer and unplug the keyboard. Take a photo of the layout for reference.

### 2. Remove Keycaps
Use the keycap puller to remove all keycaps. Be gentle with larger keys like spacebar and shift.

### 3. Clean Keycaps
Soak keycaps in warm, soapy water for 30 minutes. Rinse thoroughly and let them dry completely.

### 4. Clean the Board
Use compressed air to blow out dust. Use a brush to dislodge stubborn particles.

### 5. Clean Switches (if needed)
For sticky switches, apply a tiny amount of isopropyl alcohol with a syringe or contact cleaner.

## Maintenance Tips

- Clean your keyboard every 2-3 months
- Never eat or drink over your keyboard
- Use a keyboard cover when not in use
- Keep it away from direct sunlight

## Conclusion

Regular cleaning and maintenance will keep your mechanical keyboard looking and feeling like new for years to come.`,
      excerpt:
        'Learn how to properly clean and maintain your mechanical keyboard to extend its lifespan and keep it looking brand new.',
      coverImage:
        'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=1200',
      categoryId: blogTips.id,
      author: 'Admin',
      seoTitle: 'How to Clean & Maintain Your Mechanical Keyboard',
      seoDescription:
        'Complete guide to cleaning and maintaining your mechanical keyboard. Tips, tools, and step-by-step instructions.',
      seoKeywords: 'mechanical keyboard maintenance, keyboard cleaning, keycap cleaning',
      tagSlugs: ['mechanical-keyboard', 'office-productivity'],
    },
    {
      title: '5 Ways to Improve Your Gaming Setup for 2024',
      slug: 'improve-gaming-setup-2024',
      content: `# 5 Ways to Improve Your Gaming Setup in 2024

Whether you're a casual gamer or a competitive player, your setup can significantly impact your performance and enjoyment. Here are five upgrades worth considering.

## 1. Upgrade Your Keyboard

A mechanical keyboard is one of the most impactful upgrades you can make. The tactile feedback and faster actuation can improve your reaction time.

**Recommendation:** Pro Mechanical Keyboard RGB with hot-swappable switches.

## 2. Get a Quality Gaming Mouse

A good mouse is essential for precision aiming. Look for a sensor with at least 12000 DPI and adjustable weight.

**Recommendation:** Gaming Pro Mouse 16000 DPI.

## 3. Invest in a Large Mouse Pad

A large, high-quality mouse pad provides consistent tracking and gives you plenty of room for low-sensitivity aiming.

**Recommendation:** Extended Gaming Mouse Pad RGB.

## 4. Improve Your Ergonomics

- Use a wrist rest for your keyboard
- Position your monitor at eye level
- Consider an ergonomic chair
- Take regular breaks

## 5. Cable Management

Clean up your cables for a cleaner look and better airflow. Use cable ties, clips, and a cable management tray.

## Bonus: RGB Lighting

While purely aesthetic, RGB lighting can enhance your gaming experience and set the mood for different games.

## Conclusion

Start with the upgrades that will make the biggest difference for your specific needs and budget. Even small improvements can make a big impact on your gaming experience.`,
      excerpt:
        'Transform your gaming setup with these 5 practical upgrades. From keyboards to ergonomics, level up your battlestation.',
      coverImage:
        'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=1200',
      categoryId: blogTips.id,
      author: 'Admin',
      seoTitle: '5 Ways to Improve Your Gaming Setup 2024',
      seoDescription:
        'Upgrade your gaming setup with these 5 essential improvements. Better performance, comfort, and aesthetics.',
      seoKeywords: 'gaming setup, gaming upgrades, battlestation',
      tagSlugs: ['gaming-setup', 'gaming-mouse', 'mechanical-keyboard'],
    },
    {
      title: 'The Future of Wireless Peripherals: What to Expect in 2024',
      slug: 'future-wireless-peripherals-2024',
      content: `# The Future of Wireless Peripherals

Wireless technology has come a long way. What was once considered a compromise is now often preferred even by competitive gamers. Let's look at what's next.

## The Wireless Revolution

Gone are the days when wireless meant laggy and unreliable. Modern wireless technologies like 2.4GHz and Bluetooth 5.3 offer near-wired performance.

## Current State of Wireless

### 2.4GHz Wireless
- Near-zero latency
- Better battery life than Bluetooth
- Dedicated USB receiver

### Bluetooth
- Multi-device pairing
- No dongle needed
- Good for productivity

## What's Coming in 2024

### 1. Longer Battery Life
Expect to see wireless mice and keyboards with 2-3 years of battery life on a single charge or battery set.

### 2. Universal Dongles
One dongle for all your devices. Companies are working on standardized receivers.

### 3. Haptic Feedback
Advanced haptic technology is making its way into peripherals, adding another dimension to gaming.

### 4. AI Features
Smart features like automatic DPI adjustment based on the game you're playing.

### 5. Better Charging Solutions
Wireless charging mats, solar charging, and more efficient power management.

## Should You Go Wireless?

**For gaming:** Yes, modern 2.4GHz wireless is essentially indistinguishable from wired for most players.

**For productivity:** Absolutely, the convenience is worth it.

## Conclusion

Wireless peripherals are only going to get better. If you've been on the fence, now is a great time to make the switch.`,
      excerpt:
        'Explore the future of wireless keyboards and mice. Longer battery life, better connectivity, and exciting new features on the horizon.',
      coverImage:
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200',
      categoryId: blogNews.id,
      author: 'Admin',
      seoTitle: 'Future of Wireless Peripherals 2024 | Tech Trends',
      seoDescription:
        'What to expect from wireless keyboards and mice in 2024. Longer battery life, AI features, haptic feedback, and more.',
      seoKeywords: 'wireless peripherals, tech trends, wireless keyboard, wireless mouse',
      tagSlugs: ['tech-news', 'gaming-setup'],
    },
    {
      title: 'Why Wholesale Buyers Choose TechTrade Pro',
      slug: 'why-wholesale-buyers-choose-techtradepro',
      content: `# Why Wholesale Buyers Choose TechTrade Pro

If you're a retailer, distributor, or business buyer looking for quality computer peripherals, here's why TechTrade Pro should be your supplier of choice.

## 1. Factory-Direct Pricing

We work directly with manufacturers to bring you the best possible prices. No middlemen means better margins for your business.

- 30-50% below retail pricing
- Volume discounts available
- OEM/ODM services

## 2. Quality Assurance

Every product undergoes rigorous quality control before shipping.

- 100% functional testing
- 12-month warranty on all products
- QC inspection reports available

## 3. Wide Product Range

From mechanical keyboards to gaming mice and accessories, we offer a comprehensive catalog.

- Keyboards (mechanical, membrane, ergonomic)
- Mice (gaming, office, wireless)
- Accessories (mouse pads, keycaps, cables)

## 4. Flexible MOQ

We understand that different businesses have different needs.

- Sample orders available
- Low minimum order quantities
- Custom branding options

## 5. Reliable Shipping

Worldwide shipping with tracking and insurance.

- Air freight (3-7 days)
- Sea freight (25-40 days)
- Express options available

## 6. Dedicated Support

Your own account manager to help with every step of the process.

- 24-hour response time
- Product recommendations
- After-sales support

## Ready to Get Started?

Contact our wholesale team today to discuss your requirements and get a personalized quote.`,
      excerpt:
        'Discover why businesses worldwide trust TechTrade Pro for their wholesale computer peripherals needs.',
      coverImage:
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200',
      categoryId: blogCompany.id,
      author: 'Admin',
      seoTitle: 'Why Wholesale Buyers Choose TechTrade Pro',
      seoDescription:
        'Factory-direct pricing, quality assurance, wide product range, and dedicated support. Learn why businesses choose TechTrade Pro.',
      seoKeywords: 'wholesale computer peripherals, bulk supplier, OEM ODM',
      tagSlugs: ['wholesale', 'tech-news'],
    },
  ];

  for (const post of extraBlogPosts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    if (existing) {
      console.log(`    跳过已存在博客: ${post.title}`);
      continue;
    }
    console.log(`    创建博客: ${post.title}`);
    const { tagSlugs, ...postData } = post as any;
    const createdPost = await prisma.blogPost.create({ data: postData });

    // 分配标签
    if (Array.isArray(tagSlugs)) {
      for (const slug of tagSlugs) {
        const tag = blogTags.find((t) => t.slug === slug);
        if (tag) {
          await prisma.blogPostTagRelation.create({
            data: { postId: createdPost.id, tagId: tag.id },
          });
        }
      }
    }
  }

  // ==================== 7. 首页 Banner ====================
  console.log('  → 创建首页 Banner...');
  const bannersData = [
    {
      title: 'New Arrivals 2024',
      subtitle: 'Discover our latest premium collection',
      imageUrl:
        'https://images.unsplash.com/photo-1595225476474-87563907a212?w=1920',
      linkUrl: '/products',
      buttonText: 'Shop Now',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Summer Sale - Up to 40% Off',
      subtitle: 'Limited time offer on selected items',
      imageUrl:
        'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=1920',
      linkUrl: '/products?sale=true',
      buttonText: 'View Deals',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'Free Shipping Worldwide',
      subtitle: 'On all orders over $99',
      imageUrl:
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1920',
      linkUrl: '/about',
      buttonText: 'Learn More',
      sortOrder: 3,
      isActive: true,
    },
  ];

  for (let i = 0; i < bannersData.length; i++) {
    const count = await prisma.banner.count();
    if (count >= 3) {
      console.log('    跳过 Banner（已存在）');
      break;
    }
    await prisma.banner.create({ data: bannersData[i] });
  }

  // ==================== 8. 询盘演示数据 ====================
  console.log('  → 创建询盘演示数据...');

  // 先查出一个产品用于关联
  const sampleProduct = await prisma.product.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  const inquiriesData = [
    {
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      phone: '+1 555-123-4567',
      company: 'TechCorp Inc.',
      country: 'United States',
      subject: 'Wholesale Inquiry - Mechanical Keyboards',
      message:
        'Hi, I am interested in your mechanical keyboards for our retail store. We would like to order 200 units initially. Can you provide a wholesale price list and sample availability? We are also interested in OEM branding options.',
      isRead: true,
      isReplied: false,
    },
    {
      name: 'Maria Garcia',
      email: 'maria.g@distribuidora-latam.com',
      phone: '+52 55 1234 5678',
      company: 'Distribuidora Latam SA',
      country: 'Mexico',
      subject: 'Distribution Partnership Request',
      message:
        'Hello, we are a distributor in Mexico looking for a reliable supplier of computer peripherals. We currently serve over 50 retail stores. Could you send us your full catalog with wholesale pricing and MOQ information?',
      isRead: false,
      isReplied: false,
    },
    {
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@example.com',
      phone: '+971 50 123 4567',
      company: 'Gulf Trading LLC',
      country: 'United Arab Emirates',
      productId: sampleProduct?.id,
      subject: 'Product Inquiry - Pro Mechanical Keyboard RGB',
      message:
        'Hello, I would like to get more information about the Pro Mechanical Keyboard RGB. Specifically, I need to know: 1) Is it compatible with Mac? 2) What switches are available? 3) What is the lead time for 50 units? 4) Do you offer laser engraving for custom logos?',
      isRead: true,
      isReplied: true,
      userId: testUser.id,
    },
  ];

  for (const inquiry of inquiriesData) {
    const existing = await prisma.inquiry.findFirst({
      where: { email: inquiry.email, subject: inquiry.subject },
    });
    if (existing) {
      console.log(`    跳过已存在询盘: ${inquiry.subject}`);
      continue;
    }
    console.log(`    创建询盘: ${inquiry.subject}`);
    await prisma.inquiry.create({ data: inquiry });
  }

  // ==================== 9. 网站设置 ====================
  console.log('  → 创建网站设置...');
  await prisma.siteSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      siteName: 'TechTrade Pro',
      siteDescription:
        'Premium computer peripherals and accessories for professionals and gamers worldwide.',
      siteKeywords:
        'mechanical keyboard, gaming mouse, computer accessories, wholesale',
      logoUrl: '',
      faviconUrl: '',
      contactEmail: 'support@techtradepro.com',
      contactPhone: '+86 755-12345678',
      contactAddress: 'Shenzhen, Guangdong, China',
      socialLinks: JSON.stringify({
        facebook: 'https://facebook.com/techtradepro',
        twitter: 'https://twitter.com/techtradepro',
        instagram: 'https://instagram.com/techtradepro',
        youtube: 'https://youtube.com/@techtradepro',
        linkedin: 'https://linkedin.com/company/techtradepro',
      }),
      paymentSettings: JSON.stringify({
        paypal: { enabled: true, email: 'pay@techtradepro.com' },
        creditCard: { enabled: true, processor: 'stripe' },
        bankTransfer: { enabled: true, details: 'Contact for bank info' },
        westernUnion: { enabled: false },
      }),
      defaultShippingFee: 9.99,
      freeShippingThreshold: 99.0,
      defaultSeoTitle: 'TechTrade Pro - Premium Computer Peripherals',
      defaultSeoDescription:
        'Shop premium mechanical keyboards, gaming mice, and computer accessories. Wholesale and retail available worldwide.',
    },
  });

  console.log('\n✅ 种子数据填充完成！');
  console.log(`
  📊 数据概览:
  ├─ 用户: 2 (1 管理员 + 1 普通用户)
  ├─ 产品分类: 3
  ├─ 产品标签: 6
  ├─ 产品: 6
  ├─ 博客分类: 4
  ├─ 博客标签: 8
  ├─ 博客文章: 6+
  ├─ Banner: 3
  ├─ 询盘: 3
  └─ 网站设置: 1

  🔑 测试账号:
  ├─ 管理员: admin@example.com / admin123
  └─ 普通用户: user@example.com / user123
  `);
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
