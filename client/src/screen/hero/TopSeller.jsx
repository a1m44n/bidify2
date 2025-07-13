import { topSellerList } from "../../assets/data";
import { Container, Heading, ProfileCard, Caption, Title } from "../../components/common/Design"

export const TopSeller = () => {
    return (
        <>
            <section className="process-py-12">
                <Container>
                    <Heading title="Top Seller" subtitle="Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, architecto!"/>

                <div className="content grid grid-cols-1 md:grid-cols-5 gap-5 mt-8">
                    {topSellerList.map((item, index) => (
                        <div key={index} className="flex items-center justify-between border p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                                <ProfileCard className="w-16 h-16">
                                    <img src={item.profile} alt="" className="w-full h-full rounded-full object-cover"/>
                                </ProfileCard>

                                <div className="">
                                    <Title level={5} className="font-normal text-xl">
                                        {item.title}
                                    </Title>
                                    <Caption>${item.amount * item.id}</Caption>
                                </div>
                            </div>
                            <Title level={2} className="opacity-10">
                                0{item.id}
                            </Title>
                        </div>
                    ))}
                </div>
                </Container>
            </section>
        </>
    );
};