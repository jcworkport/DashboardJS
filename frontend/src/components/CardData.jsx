import { Card, Statistic } from "antd";

const CardData = ({ cardData, title }) => {
    return (
        <Card bordered={false} className="card">
            <Statistic
                title={title}
                value={cardData}
                className="cardcomponent"
            />
        </Card>
    );
};
export default CardData;
