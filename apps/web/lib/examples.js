export const examples = {
  'root-and-fern': {
    name: 'Root & Fern', category: 'Plants & home', image: 'plant-studio.jpg', alt: 'Glossy green leaves of a rubber plant',
    title: 'A little greener.', description: 'Indoor plants and everyday tools for tending them.',
    accent: '#243826', background: '#e4e9da',
  },
  'forma-studio': {
    name: 'Forma Studio', category: 'Home & living', image: 'studio-ceramics.jpg', alt: 'White ceramic vases with flowering branches',
    title: 'Made for the everyday.', description: 'Handcrafted pieces for a table that feels like yours.',
    accent: '#613e32', background: '#efe0d4',
  },
  'daily-grind': {
    name: 'Daily Grind', category: 'Food & drink', image: 'coffee-roastery.jpg', alt: 'Freshly roasted coffee beans',
    title: 'A better morning brew.', description: 'Small-batch coffee for slow mornings and busy days.',
    accent: '#3d2a21', background: '#ece0cb',
  },
  'common-thread': {
    name: 'Common Thread', category: 'Fashion & accessories', image: 'everyday-fashion.jpg', alt: 'A shopper wearing a burgundy jacket and sunglasses',
    title: 'Wear on repeat.', description: 'An everyday wardrobe with room for your own style.',
    accent: '#49334a', background: '#eee2ec',
  },
  'morning-crust': {
    name: 'Morning Crust', category: 'Bakery', image: 'bakery.jpg', alt: 'Freshly baked artisan bread',
    title: 'Good days start here.', description: 'Slow-fermented bread and small-batch pastries.',
    accent: '#63372a', background: '#f7e3cc',
  },
};

export function imagePath(file) {
  return '/inspiration/' + file;
}

export const catalogs = {
  'root-and-fern': [
    ['Tabletop succulent', 1850, 'potted-green.jpg'],
    ['Boston fern', 2800, 'fern.jpg'],
    ['Mini succulent', 950, 'succulent.jpg'],
    ['Indoor foliage set', 4200, 'planter.jpg'],
    ['Rubber plant', 3100, 'plant-studio.jpg'],
    ['Succulent gift duo', 2900, 'potted-green.jpg'],
  ],
  'forma-studio': [
    ['Studio vase set', 4500, 'studio-ceramics.jpg'],
    ['Everyday bowl', 1450, 'ceramic-bowl.jpg'],
    ['Glazed coffee mug', 1700, 'ceramic-mug.jpg'],
    ['Dinner plate', 2200, 'ceramic-plate.jpg'],
    ['Tall stem vase', 2900, 'studio-ceramics.jpg'],
    ['Glazed mug pair', 3100, 'ceramic-mug.jpg'],
  ],
  'daily-grind': [
    ['House roast · 250g', 2400, 'coffee-roastery.jpg'],
    ['Flat white', 480, 'coffee-cup.jpg'],
    ['Double espresso', 350, 'espresso.jpg'],
    ['Cold brew', 550, 'cold-brew.jpg'],
    ['House roast · 500g', 4400, 'coffee-roastery.jpg'],
    ['Cold brew · bottle duo', 980, 'cold-brew.jpg'],
  ],
  'common-thread': [
    ['Everyday tee', 1850, 'tee.jpg'],
    ['Studio hoodie', 3900, 'hoodie.jpg'],
    ['Straight-leg denim', 4500, 'denim.jpg'],
    ['Burgundy outerwear', 6900, 'everyday-fashion.jpg'],
    ['Everyday tee · two-pack', 3300, 'tee.jpg'],
    ['Studio hoodie · relaxed fit', 4200, 'hoodie.jpg'],
  ],
  'morning-crust': [
    ['Country sourdough loaf', 1100, 'bakery.jpg'],
    ['Butter croissant', 450, 'croissant.jpg'],
    ['Chocolate chip cookie', 300, 'cookie.jpg'],
    ['Dark chocolate brownie', 420, 'brownie.jpg'],
    ['Croissant box of four', 1550, 'croissant.jpg'],
    ['Mixed cookie box', 1450, 'cookie.jpg'],
  ],
};
