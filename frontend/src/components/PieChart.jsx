import React, { useEffect, useState } from "react";
import {
    useLoading,
    START_LOADING,
    STOP_LOADING,
    SET_ERROR,
} from "./LoadingContext";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data }) => {
    const pieData = data.pieChart;
    const uniqueDiscrepancies = Array.from(
        new Set(pieData.map((item) => item.Discrepancies))
    );

    const discrepanciesCounts = pieData.map((item) => item.count);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: "top",
                labels: {
                    font: {
                        size: 10,
                        weight: "bold", // Adjust this value to make the font size smaller or larger
                    },
                    boxWidth: 7, // Adjust this value to change the size of the colored boxes
                    padding: 7, // Adjust the spacing between legend items
                },
                title: {
                    display: true,
                    text: "Errors Breakdown",
                    font: {
                        size: 14,
                        weight: "bold",
                    },
                },
            },
            datalabels: {
                color: "white",
                // formatter: (value, context) => {
                //     return context.chart.data.labels[context.dataIndex];
                // },
                // font: {
                //     weight: "bold",
                //     size: 8,
                // },
                // textAlign: "center",
            },
        },
    };

    const pieChartData = {
        labels: uniqueDiscrepancies,
        datasets: [
            {
                label: "Total",
                data: discrepanciesCounts,
                backgroundColor: [
                    "#0ad2ff",
                    "#2962ff",
                    "#9500ff",
                    "#ff0059",
                    "#ff8c00",
                    "#b4e600",
                    "#0fffdb",
                ],
                borderColor: [
                    "#0ad2ff",
                    "#2962ff",
                    "#9500ff",
                    "#ff0059",
                    "#ff8c00",
                    "#b4e600",
                    "#0fffdb",
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="flex p-4 bg-zinc-950 rounded-md h-full w-full">
            <Doughnut
                data={pieChartData}
                options={options}
                plugins={[ChartDataLabels]}
            />
        </div>
    );
};
export default PieChart;
