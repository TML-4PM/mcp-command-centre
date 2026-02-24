import InfraDrillDown from "@/components/infra/InfraDrillDown";

const Infra = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Infrastructure</h1>
        <p className="text-muted-foreground mt-1">Live bridge data — click any card to drill down</p>
      </div>
      <InfraDrillDown />
    </div>
  );
};

export default Infra;
