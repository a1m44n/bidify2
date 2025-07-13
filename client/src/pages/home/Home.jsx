import { useState } from "react";
import { CategorySlider, Hero, ProductList, TopSeller, Process, Trust, TopCollection } from "../../routes";

export const Home = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);

    return (
    <>
        <Hero/>
        <CategorySlider onCategorySelect={setSelectedCategory}/>
        <ProductList selectedCategory={selectedCategory} />
        {/* <TopSeller/> */}
        <Process/>
        {/* <Trust/> */}
        {/* <TopCollection/> */}
    </>
    );
};