
export type SeedProductDef = {
  categoryIndex: 0 | 1 | 2 | 3;
  slug: string;
  name: string;
  description: string;
  unit: string;
  priceEstimate: number;
  weightKg: number;
  requiresPrescription?: boolean;
};


export const SLUG_LEGACY_NAMES: Record<string, string> = {
  'grechka-900g': 'Гречка ядрица, 1 кг',
  'black-tea-100g': 'Чай чёрный листовой, 250 г',
  'laundry-powder-450g': 'Стиральный порошок универсальный, 3 кг',
  'liquid-soap-500ml': 'Жидкое хозяйственное мыло, 1 л',
  'toilet-paper-1roll': 'Туалетная бумага, 8 рулонов',
  'dish-gel-1l': 'Гель для мытья посуды, 500 мл',
  'paracetamol-20tab': 'Парацетамол 500 мг, 10 таблеток',
  'activated-charcoal-30tab': 'Активированный уголь, 10 таблеток',
  'lazolvan-100ml': 'Йод 5%, 10 мл',
  'multivitamins-60cap': 'Амоксициллин 500 мг, 15 капсул',
  'sealant-600ml': 'Герметик силиконовый морозостойкий, 300 мл',
  'gloves-feita-xl': 'Перчатки нитриловые, 100 шт',
  'packing-tape-48x55m': 'Скотч упаковочный 48 мм × 50 м',
  'led-bulb-e27-25w': 'Лампа светодиодная E27, 12 Вт',
  'nurofen-forte-12tab': 'Нутридринк со вкусом банана, 200 мл',
  'sunflower-oil-1l': 'Масло подсолнечное рафинированное, 1 л',
};

export const SEED_CATEGORIES = [
  {
    title: 'Продукты и напитки',
    hint: 'Длительный срок хранения, бакалея',
    sortOrder: 1,
  },
  {
    title: 'Бытовая химия и гигиена',
    hint: 'Средства, подгузники, расходники',
    sortOrder: 2,
  },
  {
    title: 'Медикаменты и аптечка',
    hint: 'По рецепту и без — уточняется отдельно',
    sortOrder: 3,
  },
  {
    title: 'Стройматериалы и хозтовары',
    hint: 'Мелкий груз, совместная доставка',
    sortOrder: 4,
  },
] as const;

export const SEED_PRODUCT_DEFS: SeedProductDef[] = [
  {
    categoryIndex: 0,
    slug: 'grechka-900g',
    name: 'Гречка Мистраль ядрица, 900 г',
    description:
      'Пропаренная гречневая ядрица из отборных зёрен. Бумажный пакет, срок хранения до 15 месяцев. Быстро разваривается — удобна для северных условий.',
    unit: 'уп',
    priceEstimate: 134,
    weightKg: 0.9,
  },
  {
    categoryIndex: 0,
    slug: 'condensed-milk-380g',
    name: 'Сгущённое молоко Рогачевъ 8,5%, 380 г',
    description:
      'Цельное сгущённое молоко с сахаром, пастеризованное. Жестяная банка. Состав: молоко и сахар, без растительных жиров. Хранить при +0…+10 °C, после вскрытия — до +6 °C.',
    unit: 'бан',
    priceEstimate: 227,
    weightKg: 0.38,
  },
  {
    categoryIndex: 0,
    slug: 'sunflower-oil-1l',
    name: 'Масло Олейна «Оливковый микс» рафинированное, 1 л',
    description:
      'Подсолнечное рафинированное масло с 3% оливкового Extra Virgin. Пластиковая бутылка, 1 л. Универсальное: для жарки, салатов, рыбы и овощей. Хранить не выше +25 °C, срок годности 18 мес.',
    unit: 'бут',
    priceEstimate: 227,
    weightKg: 1,
  },
  {
    categoryIndex: 0,
    slug: 'black-tea-100g',
    name: 'Чай Ahmad Tea English Breakfast, 100 г',
    description:
      'Чёрный среднелистовой чай (Ассам, Кения, Цейлон). Картонная пачка. Свежий пряный аромат, подходит для завтрака, хорош с молоком.',
    unit: 'пач',
    priceEstimate: 252,
    weightKg: 0.1,
  },
  {
    categoryIndex: 0,
    slug: 'split-peas-900g',
    name: 'Горох Мистраль жёлтый колотый, 900 г',
    description:
      'Дроблёный жёлтый горох в пластиковом пакете. Время варки около 60 минут. Для супов, пюре и вторых блюд.',
    unit: 'уп',
    priceEstimate: 243,
    weightKg: 0.9,
  },

  {
    categoryIndex: 1,
    slug: 'laundry-powder-450g',
    name: 'Стиральный порошок Tide Color, 450 г',
    description:
      'Порошок для автоматической стирки цветного белья. Удаление стойких пятен, защита ткани и свежий аромат. Коробка, без фосфатов и хлора.',
    unit: 'кор',
    priceEstimate: 125,
    weightKg: 0.45,
  },
  {
    categoryIndex: 1,
    slug: 'liquid-soap-500ml',
    name: 'Мыло жидкое хозяйственное 72% ГОСТ, 500 мл',
    description:
      'Антибактериальное с пятновыводителем. Для стирки хлопка и льна, мытья посуды и влажной уборки. Пластиковый флакон, нейтральный аромат.',
    unit: 'фл',
    priceEstimate: 120,
    weightKg: 0.52,
  },
  {
    categoryIndex: 1,
    slug: 'toothpaste-100ml',
    name: 'Зубная паста Colgate Тройное действие, 100 мл',
    description:
      'Отбеливание и защита от кариеса, вкус мяты. С полирующими микрочастицами, для всей семьи. Туба в картонной коробке.',
    unit: 'тюб',
    priceEstimate: 175,
    weightKg: 0.156,
  },
  {
    categoryIndex: 1,
    slug: 'toilet-paper-1roll',
    name: 'Туалетная бумага Набережные Челны, 1 слой, 1 рулон',
    description:
      'Однослойная бумага из первичной целлюлозы, без втулки. Длина рулона 53 м, водорастворимая — не засоряет канализацию.',
    unit: 'рул',
    priceEstimate: 42,
    weightKg: 0.165,
  },
  {
    categoryIndex: 1,
    slug: 'dish-gel-1l',
    name: 'Гель Synergetic для посуды, апельсин, 1 л',
    description:
      'Антибактериальный гель на растительных ПАВ, гипоаллергенный. Удаляет жир, подходит для детской посуды и овощей. Бутылка с дозатором.',
    unit: 'бут',
    priceEstimate: 291,
    weightKg: 1.05,
  },

  {
    categoryIndex: 2,
    slug: 'paracetamol-20tab',
    name: 'Парацетамол таблетки 500 мг, 20 шт',
    description:
      'Жаропонижающее и обезболивающее при головной, зубной и мышечной боли, при повышении температуры. Без рецепта. Принимать по инструкции.',
    unit: 'уп',
    priceEstimate: 80,
    weightKg: 0.022,
    requiresPrescription: false,
  },
  {
    categoryIndex: 2,
    slug: 'activated-charcoal-30tab',
    name: 'Уголь активированный таблетки 250 мг, 30 шт',
    description:
      'Энтеросорбент при пищевых отравлениях, интоксикациях, вздутии и аллергии. Без рецепта. Блистер, хранить при температуре не выше +25 °C.',
    unit: 'уп',
    priceEstimate: 161,
    weightKg: 0.03,
    requiresPrescription: false,
  },
  {
    categoryIndex: 2,
    slug: 'lazolvan-100ml',
    name: 'Лазолван раствор 30 мг/5 мл, 100 мл',
    description:
      'Отхаркивающее при бронхите и заболеваниях дыхательных путей с вязкой мокротой. Без рецепта. Флакон, детям с 6 лет — по инструкции.',
    unit: 'фл',
    priceEstimate: 300,
    weightKg: 0.11,
    requiresPrescription: false,
  },
  {
    categoryIndex: 2,
    slug: 'nurofen-forte-12tab',
    name: 'Нурофен Форте таблетки 400 мг, 12 шт',
    description:
      'Ибупрофен 400 мг — обезболивающее и жаропонижающее при головной и зубной боли, мигрени, боли в суставах и мышцах, при простуде. Без рецепта. Краткий курс, не превышать дозу по инструкции.',
    unit: 'уп',
    priceEstimate: 113,
    weightKg: 0.05,
    requiresPrescription: false,
  },
  {
    categoryIndex: 2,
    slug: 'multivitamins-60cap',
    name: 'Мультивитамины GLS 12+9, 60 капсул',
    description:
      'БАД — источник витаминов A, D, E, C, группы B и минералов. По 1 капсуле в день во время еды. Не является лекарством. Без рецепта.',
    unit: 'бан',
    priceEstimate: 545,
    weightKg: 0.08,
    requiresPrescription: false,
  },

  {
    categoryIndex: 3,
    slug: 'sealant-600ml',
    name: 'Герметик KRONbuild PU-40 полиуретановый, 600 мл',
    description:
      'Универсальный серый герметик-паста для металла и других поверхностей. Туба, ручное нанесение. Рабочая температура +5…+30 °C.',
    unit: 'туб',
    priceEstimate: 930,
    weightKg: 0.65,
  },
  {
    categoryIndex: 3,
    slug: 'mounting-foam-750ml',
    name: 'Монтажная пена Makroflex Оригинальная, 750 мл',
    description:
      'Всесезонная однокомпонентная полиуретановая пена. Затвердевает под действием влаги. Баллон с трубочкой-аппликатором.',
    unit: 'бал',
    priceEstimate: 1580,
    weightKg: 0.88,
  },
  {
    categoryIndex: 3,
    slug: 'gloves-feita-xl',
    name: 'Перчатки хозяйственные Feita, латекс, XL',
    description:
      'Многоразовые бесшовные перчатки с рельефной поверхностью. Размер XL, чёрные. Для уборки и хозяйственных работ.',
    unit: 'пар',
    priceEstimate: 360,
    weightKg: 0.12,
  },
  {
    categoryIndex: 3,
    slug: 'packing-tape-48x55m',
    name: 'Скотч Profitto 48 мм × 55 м, белый',
    description:
      'Упаковочная клейкая лента. Высокая прочность, надёжное сцепление с картоном и плёнкой — для общей упаковки сборов.',
    unit: 'рул',
    priceEstimate: 160,
    weightKg: 0.2,
  },
  {
    categoryIndex: 3,
    slug: 'led-bulb-e27-25w',
    name: 'Лампа светодиодная Эра E27, 25 Вт, 2700 K',
    description:
      'Форма груша, матовая поверхность. Тёплый белый свет, поток 2000 лм, эквивалент ~200 Вт лампы накаливания. Срок службы до 30 000 ч.',
    unit: 'шт',
    priceEstimate: 400,
    weightKg: 0.05,
  },
];

export function seedProductAssetFile(slug: string): string {
  return `${slug}.png`;
}

export function seedProductObjectKey(slug: string): string {
  return `products/${slug}.png`;
}
