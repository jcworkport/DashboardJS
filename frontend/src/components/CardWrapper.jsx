import { Col } from "antd";
import CardData from "./CardData";

const CardWrapper = ({ data }) => {
    const cardData = data.cardData;
    const totalOrders = cardData.map((item) => item.Orders);
    const totalScans = cardData.map((item) => item.Scans);
    const totalErrors = cardData.map((item) => item.Errors);
    const lastError = cardData.map((item) => item.LastError);

    return (
        <>
            <Col xs={24} sm={12} md={6} lg={6}>
                <CardData cardData={totalOrders} title="Orders" />
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6} xxl={6}>
                <CardData cardData={totalScans} title="Scans" />
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6} xxl={6}>
                <CardData cardData={totalErrors} title="Errors" />
            </Col>
            <Col xs={24} sm={12} md={6} lg={6} xl={6} xxl={6}>
                <CardData cardData={lastError} title="Flawless Days" />
            </Col>
        </>
    );
};

export default CardWrapper;
