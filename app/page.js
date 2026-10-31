import FeaturedSection from "@/components/FeaturedSection";
import Hero from "@/components/Hero";
import SearchBox from "@/components/SearchBox";
import About from "@/components/About";
import CategoryBar from "@/components/CategoryBar";
import DbSection from "@/components/DbSection";
import Trust from "@/components/Trust";
import CtaBanner from "@/components/CtaBanner";
import Faq from "@/components/Faq";

export default function HomePage() {
  return (
    <main>
      <Hero />   
               <SearchBox />
    <CategoryBar />

        <DbSection eyebrow="شراء" title="عقارات للبيع" filters={{ deal_type: "sale" }} href="/browse?deal=sale" alt />
       <DbSection eyebrow="إيجار" title="عقارات للإيجار" filters={{ deal_type: "rent" }} href="/browse?deal=rent" />
<FeaturedSection />
      <DbSection eyebrow="إيجار" title="عقارات تجاري" filters={{ deal_type: "rent" }} href="/commercial" />

      <About />
      <Trust />
      <CtaBanner />
      <Faq />
    </main>
  );
}
