"use client";

/**
 * @author: @kokonutui
 * @description: Apple Activity Card - Customized for Quiz performance breakdown
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import "./apple-activity-ring.css";

const CircleProgress = ({ data, index }) => {
    const strokeWidth = 12; // Adjusted stroke width to look cleaner on smaller ring sizes
    const radius = (data.size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = ((100 - data.value) / 100) * circumference;

    const gradientId = `gradient-${data.label.toLowerCase()}`;
    const gradientUrl = `url(#${gradientId})`;

    return (
        <motion.div
            className="apple-ring-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
        >
            <div style={{ position: "relative" }}>
                <svg
                    width={data.size}
                    height={data.size}
                    viewBox={`0 0 ${data.size} ${data.size}`}
                    className="apple-ring-svg"
                    aria-label={`${data.label} Activity Progress - ${data.value}%`}
                >
                    <title>{`${data.label} Activity Progress - ${data.value}%`}</title>

                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop
                                offset="0%"
                                style={{
                                    stopColor: data.color,
                                    stopOpacity: 1,
                                }}
                            />
                            <stop
                                offset="100%"
                                style={{
                                    stopColor:
                                        data.color === "#FF2D55"
                                            ? "#FF6B8B"
                                            : data.color === "#A3F900"
                                            ? "#C5FF4D"
                                            : "#4DDFED",
                                    stopOpacity: 1,
                                }}
                            />
                        </linearGradient>
                    </defs>

                    <circle
                        cx={data.size / 2}
                        cy={data.size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        style={{ color: "rgba(228, 228, 231, 0.3)" }}
                    />

                    <motion.circle
                        cx={data.size / 2}
                        cy={data.size / 2}
                        r={radius}
                        fill="none"
                        stroke={gradientUrl}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: progress }}
                        transition={{
                            duration: 1.8,
                            delay: index * 0.2,
                            ease: "easeInOut",
                        }}
                        strokeLinecap="round"
                        style={{
                            filter: "drop-shadow(0 0 6px rgba(0,0,0,0.1))",
                        }}
                    />
                </svg>
            </div>
        </motion.div>
    );
};

const DetailedActivityInfo = ({ activities }) => {
    return (
        <motion.div
            className="apple-info-column"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            {activities.map((activity) => (
                <div key={activity.label} className="apple-info-item">
                    <span className="apple-info-label">
                        {activity.label}
                    </span>
                    <span
                        className="apple-info-value"
                        style={{ color: activity.color }}
                    >
                        {activity.current}
                        <span className="apple-info-unit">
                            / {activity.target} {activity.unit}
                        </span>
                    </span>
                </div>
            ))}
        </motion.div>
    );
};

export function AppleActivityCard({
    title = "Quiz Breakdown",
    correct = 0,
    wrong = 0,
    unanswered = 0,
    total = 0,
    className,
}) {
    const activities = [
        {
            label: "CORRECT",
            value: total > 0 ? Math.round((correct / total) * 100) : 0,
            color: "#A3F900",
            size: 170, // Outer Ring
            current: correct,
            target: total,
            unit: "Q",
        },
        {
            label: "INCORRECT",
            value: total > 0 ? Math.round((wrong / total) * 100) : 0,
            color: "#FF2D55",
            size: 134, // Middle Ring
            current: wrong,
            target: total,
            unit: "Q",
        },
        {
            label: "SKIPPED",
            value: total > 0 ? Math.round((unanswered / total) * 100) : 0,
            color: "#04C7DD",
            size: 98, // Inner Ring
            current: unanswered,
            target: total,
            unit: "Q",
        },
    ];

    return (
        <div className={cn("apple-card-container", className)}>
            <div className="apple-card-inner">
                <motion.h2
                    className="apple-card-title"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {title}
                </motion.h2>

                <div className="apple-rings-layout">
                    <div className="apple-rings-container">
                        {activities.map((activity, index) => (
                            <CircleProgress
                                key={activity.label}
                                data={activity}
                                index={index}
                            />
                        ))}
                    </div>
                    <DetailedActivityInfo activities={activities} />
                </div>
            </div>
        </div>
    );
}
