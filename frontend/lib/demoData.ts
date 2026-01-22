// ============================================
// Demo Data для разработки и демонстрации
// ============================================

import { Restaurant, Banner, MenuItem } from '../../shared/types';

// Категории ресторанов
export const restaurantCategories = [
  {
    id: 'italian',
    name: 'Italyan',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop',
    icon: '🍕',
  },
  {
    id: 'japanese',
    name: 'Yapon',
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop',
    icon: '🍣',
  },
  {
    id: 'burger',
    name: 'Burgerlar',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    icon: '🍔',
  },
  {
    id: 'caucasian',
    name: 'Kavkaz',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop',
    icon: '🥩',
  },
  {
    id: 'cafe',
    name: 'Kofe',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
    icon: '☕',
  },
  {
    id: 'asian',
    name: 'Osiyo',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
    icon: '🥢',
  },
];

export const demoRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Пиццерия Италия',
    description: 'Аутентичная итальянская пицца, приготовленная в дровяной печи. Свежие ингредиенты и традиционные рецепты.',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=600&fit=crop',
    category: 'italian',
    working_hours: {
      monday: '10:00-23:00',
      tuesday: '10:00-23:00',
      wednesday: '10:00-23:00',
      thursday: '10:00-23:00',
      friday: '10:00-24:00',
      saturday: '11:00-24:00',
      sunday: '11:00-23:00'
    },
    telegram_chat_id: null,
    phone: '+7 (999) 123-45-67',
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Суши Мастер',
    description: 'Свежие суши и роллы от профессиональных поваров. Японская кухня с доставкой на дом.',
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&h=600&fit=crop',
    category: 'japanese',
    working_hours: {
      monday: '11:00-22:00',
      tuesday: '11:00-22:00',
      wednesday: '11:00-22:00',
      thursday: '11:00-22:00',
      friday: '11:00-23:00',
      saturday: '12:00-23:00',
      sunday: '12:00-22:00'
    },
    telegram_chat_id: null,
    phone: '+7 (999) 234-56-78',
    is_active: true,
    is_featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Бургер Хаус',
    description: 'Сочные бургеры с домашними булочками и свежими овощами. Классика и авторские рецепты.',
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&h=600&fit=crop',
    category: 'burger',
    working_hours: {
      monday: '12:00-22:00',
      tuesday: '12:00-22:00',
      wednesday: '12:00-22:00',
      thursday: '12:00-22:00',
      friday: '12:00-23:00',
      saturday: '12:00-23:00',
      sunday: '12:00-22:00'
    },
    telegram_chat_id: null,
    phone: '+7 (999) 345-67-89',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Кавказская кухня',
    description: 'Традиционные блюда Кавказа: шашлык, хинкали, хачапури. Готовим на открытом огне.',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop',
    category: 'caucasian',
    working_hours: {
      monday: '11:00-23:00',
      tuesday: '11:00-23:00',
      wednesday: '11:00-23:00',
      thursday: '11:00-23:00',
      friday: '11:00-24:00',
      saturday: '11:00-24:00',
      sunday: '11:00-23:00'
    },
    telegram_chat_id: null,
    phone: '+7 (999) 456-78-90',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Кофейня "Уютная"',
    description: 'Свежая выпечка, ароматный кофе и легкие завтраки. Идеальное место для утреннего кофе.',
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&h=600&fit=crop',
    category: 'cafe',
    working_hours: {
      monday: '08:00-20:00',
      tuesday: '08:00-20:00',
      wednesday: '08:00-20:00',
      thursday: '08:00-20:00',
      friday: '08:00-21:00',
      saturday: '09:00-21:00',
      sunday: '09:00-20:00'
    },
    telegram_chat_id: null,
    phone: '+7 (999) 567-89-01',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Азиатская кухня',
    description: 'Пад Тай, том ям, вок с морепродуктами. Аутентичные блюда из Таиланда, Китая и Вьетнама.',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=600&fit=crop',
    category: 'asian',
    working_hours: {
      monday: '12:00-22:00',
      tuesday: '12:00-22:00',
      wednesday: '12:00-22:00',
      thursday: '12:00-22:00',
      friday: '12:00-23:00',
      saturday: '12:00-23:00',
      sunday: '12:00-22:00'
    },
    telegram_chat_id: null,
    phone: '+7 (999) 678-90-12',
    is_active: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const demoBanners: Banner[] = [
  {
    id: '1',
    restaurant_id: '1',
    title: 'Скидка 20% на пиццу',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=400&fit=crop',
    link_url: null,
    position: 'homepage',
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    restaurant_id: '2',
    title: 'Новинка: сет "Самурай"',
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=400&fit=crop',
    link_url: null,
    position: 'homepage',
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    restaurant_id: null,
    title: 'Бесплатная доставка при заказе от 1000₽',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop',
    link_url: null,
    position: 'homepage',
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Demo Menu Items для ресторанов
export const demoMenuItems: Record<string, MenuItem[]> = {
  '1': [ // Пиццерия Италия
    {
      id: 'm1',
      restaurant_id: '1',
      name: 'Пицца Маргарита',
      description: 'Томатный соус, моцарелла, базилик',
      price: 450,
      category: 'Пицца',
      image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm2',
      restaurant_id: '1',
      name: 'Пицца Пепперони',
      description: 'Томатный соус, моцарелла, пепперони',
      price: 550,
      category: 'Пицца',
      image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm3',
      restaurant_id: '1',
      name: 'Пицца Четыре сыра',
      description: 'Моцарелла, горгонзола, пармезан, рикотта',
      price: 650,
      category: 'Пицца',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm4',
      restaurant_id: '1',
      name: 'Паста Карбонара',
      description: 'Спагетти, бекон, сливки, пармезан',
      price: 480,
      category: 'Паста',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm5',
      restaurant_id: '1',
      name: 'Паста Болоньезе',
      description: 'Спагетти, мясной соус, пармезан',
      price: 520,
      category: 'Паста',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm6',
      restaurant_id: '1',
      name: 'Тирамису',
      description: 'Классический итальянский десерт',
      price: 350,
      category: 'Десерты',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    }
  ],
  '2': [ // Суши Мастер
    {
      id: 'm7',
      restaurant_id: '2',
      name: 'Филадельфия',
      description: 'Лосось, сливочный сыр, огурец',
      price: 420,
      category: 'Роллы',
      image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm8',
      restaurant_id: '2',
      name: 'Калифорния',
      description: 'Краб, авокадо, огурец, икра',
      price: 380,
      category: 'Роллы',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm9',
      restaurant_id: '2',
      name: 'Сет "Самурай"',
      description: '8 роллов, 12 нигири, мисо-суп',
      price: 1200,
      category: 'Сеты',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm10',
      restaurant_id: '2',
      name: 'Нигири с лососем',
      description: '2 шт',
      price: 280,
      category: 'Суши',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm11',
      restaurant_id: '2',
      name: 'Мисо-суп',
      description: 'Традиционный японский суп',
      price: 180,
      category: 'Супы',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    }
  ],
  '3': [ // Бургер Хаус
    {
      id: 'm12',
      restaurant_id: '3',
      name: 'Классический бургер',
      description: 'Говядина, салат, помидор, лук, соус',
      price: 350,
      category: 'Бургеры',
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm13',
      restaurant_id: '3',
      name: 'Чизбургер',
      description: 'Говядина, сыр, салат, помидор, соус',
      price: 380,
      category: 'Бургеры',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm14',
      restaurant_id: '3',
      name: 'Картофель фри',
      description: 'Порция',
      price: 150,
      category: 'Гарниры',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm15',
      restaurant_id: '3',
      name: 'Кола',
      description: '0.5л',
      price: 120,
      category: 'Напитки',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    }
  ],
  '4': [ // Кавказская кухня
    {
      id: 'm16',
      restaurant_id: '4',
      name: 'Шашлык из баранины',
      description: '300г, с овощами',
      price: 650,
      category: 'Шашлыки',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm17',
      restaurant_id: '4',
      name: 'Хинкали',
      description: '8 шт, с бульоном',
      price: 450,
      category: 'Хинкали',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm18',
      restaurant_id: '4',
      name: 'Хачапури по-аджарски',
      description: 'С яйцом и сыром',
      price: 380,
      category: 'Хачапури',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    }
  ],
  '5': [ // Кофейня "Уютная"
    {
      id: 'm19',
      restaurant_id: '5',
      name: 'Капучино',
      description: 'Двойной эспрессо, молоко, пенка',
      price: 180,
      category: 'Кофе',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm20',
      restaurant_id: '5',
      name: 'Латте',
      description: 'Эспрессо, молоко',
      price: 200,
      category: 'Кофе',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm21',
      restaurant_id: '5',
      name: 'Круассан',
      description: 'Свежая выпечка',
      price: 120,
      category: 'Выпечка',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    }
  ],
  '6': [ // Азиатская кухня
    {
      id: 'm22',
      restaurant_id: '6',
      name: 'Пад Тай',
      description: 'Рисовая лапша с креветками',
      price: 480,
      category: 'Основные блюда',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm23',
      restaurant_id: '6',
      name: 'Том Ям',
      description: 'Острый суп с креветками',
      price: 420,
      category: 'Супы',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'm24',
      restaurant_id: '6',
      name: 'Вок с курицей',
      description: 'Овощи, курица, соус',
      price: 450,
      category: 'Основные блюда',
      image_url: null,
      is_available: true,
      created_at: new Date().toISOString()
    }
  ]
};

