import { Helmet } from "react-helmet-async";
import {
  createOrganizationJsonLd,
  createPersonJsonLd,
  createWebsiteJsonLd,
} from "@/lib/structuredData";

const GlobalEntitySchema = () => {
  const organizationJsonLd = createOrganizationJsonLd();
  const personJsonLd = createPersonJsonLd();
  const websiteJsonLd = createWebsiteJsonLd();

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(personJsonLd)}</script>
    </Helmet>
  );
};

export default GlobalEntitySchema;
