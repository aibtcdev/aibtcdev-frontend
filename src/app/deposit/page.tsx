import BitcoinDeposit from "@/components/btc-deposit";

const page = () => {
  return (
    <div>
      <BitcoinDeposit
        dexId={1}
        dexContract={
          "ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facemelt-faktory-dex"
        }
        daoName="FACEMELT"
        tokenContract="ST2Q77H5HHT79JK4932JCFDX4VY6XA3Y1F61A25CD.facemelt-faktory"
      />
    </div>
  );
};
export default page;

// const page = () => {
//   return <div>deposit page..</div>;
// };
// export default page;
