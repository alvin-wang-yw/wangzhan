import { setRequestLocale } from 'next-intl/server';
import AddressList from '@/components/account/address/AddressList';

interface Props {
  params: { locale: string };
}

export default async function AccountAddressesPage({ params: { locale } }: Props) {
  setRequestLocale(locale);

  return <AddressList locale={locale} />;
}
