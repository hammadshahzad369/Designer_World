export const examples = {
  'root-and-fern': {
    name: 'Root & Fern', category: 'Plants & home', image: 'plant-studio.jpg', alt: 'Glossy green leaves of a rubber plant',
    title: 'A little greener.', description: 'Indoor plants and everyday tools for tending them.',
    product: 'Tabletop plant', price: 'Rs. 1,850', productImage: 'potted-green.jpg', accent: '#243826', background: '#e4e9da',
  },
  'forma-studio': {
    name: 'Forma Studio', category: 'Home & living', image: 'studio-ceramics.jpg', alt: 'White ceramic vases with flowering branches',
    title: 'Made for the everyday.', description: 'Handcrafted pieces for a table that feels like yours.',
    product: 'Studio vase set', price: 'Rs. 4,500', accent: '#613e32', background: '#efe0d4',
  },
  'daily-grind': {
    name: 'Daily Grind', category: 'Food & drink', image: 'coffee-roastery.jpg', alt: 'Freshly roasted coffee beans',
    title: 'A better morning brew.', description: 'Small-batch coffee for slow mornings and busy days.',
    product: 'House roast', price: 'Rs. 2,400', accent: '#3d2a21', background: '#ece0cb',
  },
  'common-thread': {
    name: 'Common Thread', category: 'Fashion & accessories', image: 'everyday-fashion.jpg', alt: 'A shopper wearing a burgundy jacket and sunglasses',
    title: 'Wear on repeat.', description: 'An everyday wardrobe with room for your own style.',
    product: 'Everyday collection', price: 'From Rs. 3,200', accent: '#49334a', background: '#eee2ec',
  },
};

export function imagePath(file) {
  return '/inspiration/' + file;
}
