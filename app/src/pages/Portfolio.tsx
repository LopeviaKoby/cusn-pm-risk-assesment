import { PageHeading, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/primitives";
import { PortfolioPerformance } from "@/components/organisms/portfolio-performance";
import { useData } from "@/data/bootstrap";
import { date } from "@/data/format";
import Finance from "./Finance";

export default function Portfolio() {
  const { data } = useData();
  return <div className="page portfolio-page"><PageHeading title="Portafolio" description="Desempeño de proyectos visibles para tu sesión."><span className="cutoff">Corte: {date(data?.asOfDate)}</span></PageHeading>
    <Tabs defaultValue="general"><TabsList aria-label="Vistas de portafolio"><TabsTrigger value="general">General</TabsTrigger><TabsTrigger value="finanzas">Finanzas</TabsTrigger></TabsList><TabsContent value="general"><PortfolioPerformance /></TabsContent><TabsContent value="finanzas"><Finance /></TabsContent></Tabs>
  </div>;
}
