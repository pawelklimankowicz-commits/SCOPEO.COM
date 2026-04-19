import { permanentRedirect } from 'next/navigation';

/** Alias języka angielskiego → kanoniczna strona produktu „Ślad węglowy”. */
export default function CarbonFootprintAliasPage() {
  permanentRedirect('/slad-weglowy');
}
