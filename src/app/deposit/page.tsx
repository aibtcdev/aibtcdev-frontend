import BitcoinDeposit from "@/components/btc-deposit";

const page = () => {
  return (
    <div>
      <BitcoinDeposit
        dexId={1}
        dexContract={
          "ST2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5EWQWKRW.visvasa1-faktory-dex"
        }
        daoName="visvasa"
        tokenContract="ST2HH7PR5SENEXCGDHSHGS5RFPMACEDRN5EWQWKRW.visvasa1-faktory"
      />
    </div>
  );
};
export default page;

// const page = () => {
//   return <div>deposit page..</div>;
// };
// export default page;
