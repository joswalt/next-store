import ProductList from "@/components/shared/product/product-list";
import sampleData from "@/db/sample-data";

const HomePage = () => {
  return (
    <>
      <ProductList data={sampleData.products} limit={4} title="Newest Arrivals" />
    </>
  );
};

export default HomePage;
