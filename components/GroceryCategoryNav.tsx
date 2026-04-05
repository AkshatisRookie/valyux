import React from 'react';

export interface GroceryCategoryNavProps {
  onPickSearch: (query: string) => void;
}

type CatItem = { label: string; query: string; image: string };

const SECTIONS: { title: string; items: CatItem[] }[] = [
  {
    title: 'Grocery & Kitchen',
    items: [
      {
        label: 'Vegetables & Fruits',
        query: 'vegetables fruits',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Vegetables_&_Fruits_312x360_1765863495231',
      },
      {
        label: 'Atta, Rice & Dal',
        query: 'rice atta dal',
        image: 'https://cdn.grofers.com/app/images/collections/asset_atta,_rice_&_dal_1697023078302',
      },
      {
        label: 'Oil, Ghee & Masala',
        query: 'cooking oil ghee masala',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Oil,_ghee_&_masala_1697023177309',
      },
      {
        label: 'Dairy, Bread & Eggs',
        query: 'milk bread eggs',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Dairy,_bread_&_eggs_1697439479199',
      },
      {
        label: 'Bakery & Biscuits',
        query: 'biscuits bakery',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Biscuits_&_bakery_1697023878012',
      },
      {
        label: 'Dry Fruits & Cereals',
        query: 'dry fruits cereal',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Dry_Fruits_&_Cereals_(1)_1727547591238',
      },
      {
        label: 'Chicken, Meat & Fish',
        query: 'chicken meat fish',
        image: 'https://cdn.grofers.com/app/images/collections/asset_chicken,_meat_&_fish_1697025365538',
      },
      {
        label: 'Kitchenware & Accessories',
        query: 'kitchenware',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Kitchen_Utensils_&_1697802997422',
      },
    ],
  },
  {
    title: 'Snacks & Drinks',
    items: [
      {
        label: 'Chips & Namkeen',
        query: 'chips namkeen',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Chips_&_namkeen_1697025537433',
      },
      {
        label: 'Sweets & Chocolates',
        query: 'chocolate sweets',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Sweets_&_chocolates_1697025717829',
      },
      {
        label: 'Drinks & Juices',
        query: 'juice cold drink',
        image: 'https://cdn.grofers.com/app/images/collections/asset_V7_312x360_(2)_1774455548692',
      },
      {
        label: 'Tea, Coffee & Milk Drinks',
        query: 'tea coffee',
        image: 'https://cdn.grofers.com/app/images/collections/asset_L0_v1_0_1746557294148',
      },
      {
        label: 'Instant Food',
        query: 'instant noodles soup',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Instant_Food_(2)_1766127254031',
      },
      {
        label: 'Sauces & Spreads',
        query: 'sauce jam spread',
        image: 'https://cdn.grofers.com/app/images/collections/asset_sauces_&_spreads_1697025783179',
      },
      {
        label: 'Paan Corner',
        query: 'mouth freshener',
        image: 'https://cdn.grofers.com/app/images/collections/asset_312x360_(1)_1750440200815',
      },
      {
        label: 'Ice Creams & More',
        query: 'ice cream',
        image: 'https://cdn.grofers.com/app/images/collections/asset_V7_312x360_(1)_1763118369111',
      },
    ],
  },
  {
    title: 'Beauty & Personal Care',
    items: [
      {
        label: 'Bath & Body',
        query: 'soap body wash lotion',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Bath_&_Body_1697028879274',
      },
      {
        label: 'Hair Care',
        query: 'shampoo conditioner hair oil',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Hair_1697025936187',
      },
      {
        label: 'Skin & Face Care',
        query: 'face wash moisturizer skin care',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Skin_&_face_(1)_1710665369044',
      },
      {
        label: 'Beauty & Cosmetics',
        query: 'makeup lipstick beauty',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Beauty_&_Cosmetics_1714732446632',
      },
      {
        label: 'Feminine Hygiene',
        query: 'sanitary pads feminine care',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Feminine_hygiene_1697028415717',
      },
      {
        label: 'Baby Care',
        query: 'baby care wipes diapers',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Baby_care_1697028457580',
      },
      {
        label: 'Health & Pharma',
        query: 'medicine health supplements',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Health_&_pharma_1697028551531',
      },
      {
        label: 'Sexual Wellness',
        query: 'sexual wellness personal care',
        image: 'https://cdn.grofers.com/app/images/collections/asset_Sexual_wellness_1697028588156',
      },
    ],
  },
];

const GroceryCategoryNav: React.FC<GroceryCategoryNavProps> = ({ onPickSearch }) => {
  return (
    <nav className="w-full" aria-label="Browse grocery categories">
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-10 last:mb-6">
          <h2 className="mb-3 text-left text-base font-bold tracking-tight text-neutral-900 dark:text-white sm:text-lg">
            {section.title}
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {section.items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onPickSearch(item.query)}
                className="group flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 rounded-xl dark:focus-visible:ring-offset-neutral-950"
              >
                <div className="relative w-full overflow-hidden rounded-xl bg-[#eef2f4] dark:bg-neutral-800/70 aspect-square shadow-sm ring-1 ring-black/[0.04] dark:ring-white/10 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]">
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="mt-2 line-clamp-2 min-h-[2.5rem] w-full px-0.5 text-[11px] font-medium leading-snug text-neutral-800 dark:text-neutral-200 sm:text-xs">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default GroceryCategoryNav;
