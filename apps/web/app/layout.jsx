import './styles.css';

export const metadata = {
  title: { default: 'StoreCraft', template: '%s | StoreCraft' },
  description: 'Build and manage your online store.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
