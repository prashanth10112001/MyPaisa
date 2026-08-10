import { useFinanceStore } from "@/store/useFinanceStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

type ViewMode = "weekly" | "monthly" | "yearly" | "custom";

export default function ReportsScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());

  // 🚀 ACCOUNT FILTER STATE
  const [selectedBankId, setSelectedBankId] = useState<string>("ALL");

  // INTERACTIVE CHECKBOX STATES
  const [showInflow, setShowInflow] = useState(true);
  const [showOutflow, setShowOutflow] = useState(true);

  const [customStart, setCustomStart] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() - 7)),
  );
  const [customEnd, setCustomEnd] = useState<Date>(new Date());

  const [showPicker, setShowPicker] = useState<{
    visible: boolean;
    target: "start" | "end";
  }>({
    visible: false,
    target: "start",
  });

  // Pull data from store
  const transactions = useFinanceStore((state) => state.transactions);
  const banks = useFinanceStore((state) => state.banks || []); // Fallback to empty array if undefined
  const today = useMemo(() => new Date(), []);

  // 🚀 FILTER TRANSACTIONS BY SELECTED ACCOUNT
  const bankFilteredTransactions = useMemo(() => {
    if (selectedBankId === "ALL") return transactions;
    return transactions.filter(
      (tx) =>
        tx.bankId === selectedBankId || tx.targetBankId === selectedBankId,
    );
  }, [transactions, selectedBankId]);

  // 1. Calculate Date Bounds
  const dateBounds = useMemo(() => {
    const start = new Date(referenceDate);
    const end = new Date(referenceDate);

    if (viewMode === "weekly") {
      const dateNum = referenceDate.getDate();
      if (dateNum <= 7) {
        start.setDate(1);
        end.setDate(7);
      } else if (dateNum <= 14) {
        start.setDate(8);
        end.setDate(14);
      } else if (dateNum <= 21) {
        start.setDate(15);
        end.setDate(21);
      } else {
        start.setDate(22);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
      }
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "monthly") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (viewMode === "yearly") {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setTime(customStart.getTime());
      start.setHours(0, 0, 0, 0);
      end.setTime(customEnd.getTime());
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }, [referenceDate, viewMode, customStart, customEnd]);

  const isNextDisabled = useMemo(() => {
    if (viewMode === "custom") return true;
    return dateBounds.end >= today;
  }, [dateBounds, viewMode, today]);

  const navigationLabel = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
    };
    if (viewMode === "weekly") {
      return `${dateBounds.start.toLocaleDateString("en-IN", options)} - ${dateBounds.end.toLocaleDateString("en-IN", { ...options, year: "numeric" })}`;
    } else if (viewMode === "monthly") {
      return referenceDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
    } else if (viewMode === "yearly") {
      return referenceDate.getFullYear().toString();
    } else {
      return "Custom Window Select";
    }
  }, [dateBounds, viewMode, referenceDate]);

  // 2. KPI Metrics Parser Engine & Category Map compiler
  const metrics = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    const categoryMap: { [key: string]: number } = {};

    const filteredTx = bankFilteredTransactions.filter((tx) => {
      const txDate = new Date(tx.dateTime);
      return txDate >= dateBounds.start && txDate <= dateBounds.end;
    });

    filteredTx.forEach((tx) => {
      if (tx.type === "credit") {
        inflow += tx.amount;
      } else if (tx.type === "debit") {
        outflow += tx.amount;
        categoryMap[tx.categoryType] =
          (categoryMap[tx.categoryType] || 0) + tx.amount;
      } else if (tx.type === "transfer" && selectedBankId !== "ALL") {
        if (tx.targetBankId === selectedBankId) inflow += tx.amount;
        if (tx.bankId === selectedBankId) {
          outflow += tx.amount;
          categoryMap["Transfers"] =
            (categoryMap["Transfers"] || 0) + tx.amount;
        }
      }
    });

    let savingsRate = inflow > 0 ? ((inflow - outflow) / inflow) * 100 : 0;
    const msDiff = dateBounds.end.getTime() - dateBounds.start.getTime();
    const daysCount = Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    const burnRate = outflow / daysCount;

    let topCategory = "None";
    let topCategoryAmount = 0;
    Object.keys(categoryMap).forEach((cat) => {
      if (categoryMap[cat] > topCategoryAmount) {
        topCategoryAmount = categoryMap[cat];
        topCategory = cat;
      }
    });
    const dragPercentage =
      outflow > 0 ? (topCategoryAmount / outflow) * 100 : 0;

    // Compile categorized expenditure items sorted descending
    const categoryBreakdownList = Object.keys(categoryMap)
      .map((cat) => ({
        name: cat,
        amount: categoryMap[cat],
        percentage: outflow > 0 ? (categoryMap[cat] / outflow) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      savingsRate,
      burnRate,
      topCategory,
      dragPercentage,
      inflow,
      outflow,
      categoryBreakdownList,
    };
  }, [bankFilteredTransactions, dateBounds, selectedBankId]);

  // 🚀 3. MERGED V1 TIME-CLAMPED HISTORICAL ENGINE
  const historicalLineData = useMemo(() => {
    const inflowData: any[] = [];
    const outflowData: any[] = [];
    const breakdownList: any[] = [];
    const now = new Date(referenceDate);

    if (viewMode === "monthly" || viewMode === "custom") {
      for (let i = 4; i >= 0; i--) {
        const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const labelStr = targetMonth.toLocaleDateString("en-US", {
          month: "short",
        });
        const fullLabelStr = targetMonth.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
        let inc = 0;
        let exp = 0;

        bankFilteredTransactions.forEach((tx) => {
          const txDate = new Date(tx.dateTime);
          if (
            txDate.getMonth() === targetMonth.getMonth() &&
            txDate.getFullYear() === targetMonth.getFullYear()
          ) {
            if (tx.type === "credit") inc += tx.amount;
            if (tx.type === "debit") exp += tx.amount;
            if (tx.type === "transfer" && selectedBankId !== "ALL") {
              if (tx.targetBankId === selectedBankId) inc += tx.amount;
              if (tx.bankId === selectedBankId) exp += tx.amount;
            }
          }
        });

        inflowData.push({ value: inc, label: labelStr });
        outflowData.push({ value: exp, label: labelStr });
        breakdownList.unshift({ title: fullLabelStr, inc, exp });
      }
    } else if (viewMode === "weekly") {
      for (let i = 1; i <= 4; i++) {
        let start = new Date(now.getFullYear(), now.getMonth(), 1);
        let end = new Date(now.getFullYear(), now.getMonth(), 7);
        if (i === 2) {
          start.setDate(8);
          end.setDate(14);
        } else if (i === 3) {
          start.setDate(15);
          end.setDate(21);
        } else if (i === 4) {
          start.setDate(22);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
        }

        const labelStr = `W${i}`;
        const labelDateStr = `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString("en-US", { month: "short" })}`;
        let inc = 0;
        let exp = 0;

        bankFilteredTransactions.forEach((tx) => {
          const txDate = new Date(tx.dateTime);
          if (txDate >= start && txDate <= end) {
            if (tx.type === "credit") inc += tx.amount;
            if (tx.type === "debit") exp += tx.amount;
            if (tx.type === "transfer" && selectedBankId !== "ALL") {
              if (tx.targetBankId === selectedBankId) inc += tx.amount;
              if (tx.bankId === selectedBankId) exp += tx.amount;
            }
          }
        });

        inflowData.push({ value: inc, label: labelStr });
        outflowData.push({ value: exp, label: labelStr });
        breakdownList.unshift({
          title: `Week ${i}`,
          subtitle: labelDateStr,
          inc,
          exp,
        });
      }
    } else {
      const currentYear = now.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const targetYear = currentYear - i;
        let inc = 0;
        let exp = 0;

        bankFilteredTransactions.forEach((tx) => {
          if (new Date(tx.dateTime).getFullYear() === targetYear) {
            if (tx.type === "credit") inc += tx.amount;
            if (tx.type === "debit") exp += tx.amount;
            if (tx.type === "transfer" && selectedBankId !== "ALL") {
              if (tx.targetBankId === selectedBankId) inc += tx.amount;
              if (tx.bankId === selectedBankId) exp += tx.amount;
            }
          }
        });

        inflowData.push({ value: inc, label: targetYear.toString() });
        outflowData.push({ value: exp, label: targetYear.toString() });
        breakdownList.unshift({ title: `Year ${targetYear}`, inc, exp });
      }
    }

    const allValues = [
      ...inflowData.map((d) => d.value),
      ...outflowData.map((d) => d.value),
    ];
    const maxVal = Math.max(...allValues, 1000);

    return { inflowData, outflowData, maxVal, breakdownList };
  }, [bankFilteredTransactions, viewMode, referenceDate, selectedBankId]);

  const stepBackward = () => {
    setReferenceDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "weekly") {
        const currentDay = prev.getDate();
        if (currentDay > 21) next.setDate(21);
        else if (currentDay > 14) next.setDate(14);
        else if (currentDay > 7) next.setDate(7);
        else {
          next.setMonth(next.getMonth() - 1);
          next.setDate(22);
        }
      }
      if (viewMode === "monthly") next.setMonth(next.getMonth() - 1);
      if (viewMode === "yearly") next.setFullYear(next.getFullYear() - 1);
      return next;
    });
  };

  const stepForward = () => {
    if (isNextDisabled) return;
    setReferenceDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "weekly") {
        const currentDay = prev.getDate();
        if (currentDay <= 7) next.setDate(8);
        else if (currentDay <= 14) next.setDate(15);
        else if (currentDay <= 21) next.setDate(22);
        else {
          next.setMonth(next.getMonth() + 1);
          next.setDate(1);
        }
      }
      if (viewMode === "monthly") next.setMonth(next.getMonth() + 1);
      if (viewMode === "yearly") next.setFullYear(next.getFullYear() + 1);
      return next > today ? today : next;
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker({ visible: false, target: "start" });
    if (!selectedDate) return;
    if (showPicker.target === "start") setCustomStart(selectedDate);
    else setCustomEnd(selectedDate > today ? today : selectedDate);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <View className="p-4 pb-2">
        <Text className="text-white text-2xl font-black tracking-tight">
          Financial Analytics
        </Text>
      </View>

      {/* 🚀 ACCOUNT SELECTION CHIPS */}
      {banks.length > 0 && (
        <View className="mb-3 px-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedBankId("ALL")}
              className={`px-4 py-1.5 rounded-full border ${
                selectedBankId === "ALL"
                  ? "bg-emerald-500 border-emerald-400"
                  : "bg-slate-950 border-slate-900"
              }`}
            >
              <Text
                className={`text-[10px] font-black tracking-wide uppercase ${
                  selectedBankId === "ALL" ? "text-black" : "text-slate-400"
                }`}
              >
                ALL ACCOUNTS
              </Text>
            </TouchableOpacity>

            {banks.map((bank: any) => {
              const isSelected = selectedBankId === bank.id;
              return (
                <TouchableOpacity
                  key={bank.id}
                  onPress={() => setSelectedBankId(bank.id)}
                  className={`px-4 py-1.5 rounded-full border ${
                    isSelected
                      ? "bg-emerald-500 border-emerald-400"
                      : "bg-slate-950 border-slate-900"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-black tracking-wide uppercase ${
                      isSelected ? "text-black" : "text-slate-400"
                    }`}
                  >
                    {bank.bankName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* VIEW MODE SEGMENTED ROW */}
        <View className="flex-row bg-slate-950 border border-slate-900 p-1 rounded-xl mb-4 gap-1">
          {(["weekly", "monthly", "yearly", "custom"] as const).map((mode) => {
            const isActive = viewMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => {
                  setViewMode(mode);
                  setReferenceDate(new Date());
                }}
                className={`flex-1 py-2 rounded-lg items-center justify-center ${isActive ? "bg-slate-900 border border-slate-800" : "bg-transparent"}`}
              >
                <Text
                  className={`text-[9px] font-black uppercase tracking-wider ${isActive ? "text-emerald-400" : "text-slate-500"}`}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DATE NAVIGATION PANEL */}
        {viewMode !== "custom" ? (
          <View className="flex-row items-center justify-between bg-slate-950 border border-slate-900 rounded-2xl px-4 py-3 mb-4">
            <TouchableOpacity
              onPress={stepBackward}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800"
            >
              <Ionicons name="chevron-back" size={14} color="#10b981" />
            </TouchableOpacity>
            <Text className="text-white font-extrabold text-sm">
              {navigationLabel}
            </Text>
            <TouchableOpacity
              onPress={stepForward}
              disabled={isNextDisabled}
              className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${isNextDisabled ? "opacity-20" : "opacity-100"}`}
            >
              <Ionicons
                name="chevron-forward"
                size={14}
                color={isNextDisabled ? "#64748b" : "#10b981"}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setShowPicker({ visible: true, target: "start" })}
              className="flex-1 bg-slate-950 border border-slate-900 p-3 rounded-xl"
            >
              <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-wider mb-1">
                From Date
              </Text>
              <Text className="text-white text-xs font-bold">
                {customStart.toLocaleDateString("en-IN")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPicker({ visible: true, target: "end" })}
              className="flex-1 bg-slate-950 border border-slate-900 p-3 rounded-xl"
            >
              <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-wider mb-1">
                To Date
              </Text>
              <Text className="text-white text-xs font-bold">
                {customEnd.toLocaleDateString("en-IN")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI MATRIX STATUS MATRIX */}
        <View className="flex-row gap-2.5 mb-4">
          <View className="flex-1 bg-slate-950 border border-slate-900 p-3.5 rounded-2xl shadow-xl">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider">
                Savings Rate
              </Text>
              <Ionicons
                name="leaf"
                size={10}
                color={metrics.savingsRate >= 20 ? "#34d399" : "#ffb703"}
              />
            </View>
            <Text
              className={`text-base font-black tracking-tight ${metrics.savingsRate < 0 ? "text-rose-500" : "text-white"}`}
            >
              {metrics.savingsRate.toFixed(1)}%
            </Text>
            <Text className="text-slate-600 text-[7px] font-bold mt-1">
              {metrics.savingsRate >= 20 ? "Target Secured" : "Under Target"}
            </Text>
          </View>

          <View className="flex-1 bg-slate-950 border border-slate-900 p-3.5 rounded-2xl shadow-xl">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider">
                Burn Rate
              </Text>
              <Ionicons name="flame" size={11} color="#f43f5e" />
            </View>
            <Text className="text-white text-base font-black tracking-tight">
              ₹{Math.round(metrics.burnRate).toLocaleString("en-IN")}
            </Text>
            <Text className="text-slate-600 text-[7px] font-bold mt-1">
              Rupees / Day spent
            </Text>
          </View>

          <View className="flex-1 bg-slate-950 border border-slate-900 p-3.5 rounded-2xl shadow-xl">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-[8px] font-black uppercase tracking-wider">
                Top Drag
              </Text>
              <Ionicons name="alert-circle" size={11} color="#38bdf8" />
            </View>
            <Text
              numberOfLines={1}
              className="text-white text-xs font-black tracking-tight uppercase truncate"
            >
              {metrics.topCategory}
            </Text>
            <Text className="text-slate-600 text-[7px] font-bold mt-1">
              {metrics.dragPercentage > 0
                ? `${Math.round(metrics.dragPercentage)}% of total spend`
                : "No Drain"}
            </Text>
          </View>
        </View>

        {/* 🚀 THE LIVE SMOOTH LINE CURVE GRAPH PORTAL WITH CHECKBOXES */}
        <View className="bg-slate-950 border border-slate-900 rounded-2xl p-4 shadow-xl mb-4">
          <View className="flex-row items-center justify-between mb-6 pb-2 border-b border-slate-900 w-full">
            <View className="flex-row items-center gap-2">
              <Ionicons name="analytics" size={13} color="#10b981" />
              <Text className="text-white text-xs font-black uppercase tracking-wider">
                Trend Curvature
              </Text>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowInflow(!showInflow)}
                className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg border ${showInflow ? "bg-emerald-950/40 border-emerald-500/30" : "bg-transparent border-slate-900"}`}
              >
                <Ionicons
                  name={showInflow ? "checkbox" : "square-outline"}
                  size={10}
                  color={showInflow ? "#34d399" : "#475569"}
                />
                <Text
                  className={`text-[8px] font-black uppercase ${showInflow ? "text-emerald-400" : "text-slate-500"}`}
                >
                  Inflow
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowOutflow(!showOutflow)}
                className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-lg border ${showOutflow ? "bg-rose-950/40 border-rose-500/30" : "bg-transparent border-slate-900"}`}
              >
                <Ionicons
                  name={showOutflow ? "checkbox" : "square-outline"}
                  size={10}
                  color={showOutflow ? "#f43f5e" : "#475569"}
                />
                <Text
                  className={`text-[8px] font-black uppercase ${showOutflow ? "text-rose-400" : "text-slate-500"}`}
                >
                  Outflow
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* DYNAMIC DUAL LINE RENDER HOOK (SPACING & KEY FIXES APPLIED) */}
          <View style={{ width: "100%", paddingLeft: 10, paddingRight: 20 }}>
            <LineChart
              key={`${viewMode}-${historicalLineData.inflowData.length}-${selectedBankId}`}
              data={historicalLineData.inflowData}
              data2={historicalLineData.outflowData}
              spacing={Math.floor(
                260 / (historicalLineData.inflowData.length - 1),
              )}
              initialSpacing={20}
              xAxisLabelsVerticalShift={2}
              curved
              curvature={0}
              animateOnDataChange
              animationDuration={400}
              thickness={2.5}
              color1={showInflow ? "#34d399" : "transparent"}
              color2={showOutflow ? "#f43f5e" : "transparent"}
              dataPointsColor1={showInflow ? "#34d399" : "transparent"}
              dataPointsColor2={showOutflow ? "#f43f5e" : "transparent"}
              dataPointsRadius={showInflow || showOutflow ? 3 : 0}
              height={140}
              maxValue={historicalLineData.maxVal}
              noOfSections={3}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#1e293b"
              yAxisTextStyle={{
                color: "#475569",
                fontSize: 8,
                fontWeight: "700",
              }}
              hideRules={false}
              rulesColor="#0f172a"
              labelsExtraHeight={10}
              xAxisLabelTextStyle={{
                color: "#64748b",
                fontSize: 9,
                fontWeight: "800",
                width: 60,
                textAlign: "center",
              }}
              formatYLabel={(val) => {
                const num = Number(val);
                if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
                return val;
              }}
            />
          </View>
        </View>

        {/* 🚀 5. HISTORICAL BREAKDOWN TIME-SEGMENT LIST */}
        <View className="bg-slate-950 border border-slate-900 rounded-2xl p-4 shadow-xl mb-4">
          <View className="flex-row items-center gap-2 mb-4 pb-2 border-b border-slate-900">
            <Ionicons name="list" size={13} color="#38bdf8" />
            <Text className="text-white text-xs font-black uppercase tracking-wider">
              Time-Segment Performance
            </Text>
          </View>

          <View className="gap-2.5">
            {historicalLineData.breakdownList.map((item, index) => {
              const balance = item.inc - item.exp;
              const isPositive = balance >= 0;

              return (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-3 bg-slate-900/40 border border-slate-900 rounded-xl"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-white text-xs font-black tracking-tight">
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text className="text-slate-500 text-[9px] font-bold mt-0.5">
                        {item.subtitle}
                      </Text>
                    )}
                  </View>

                  <View className="flex-row items-center gap-4 text-right">
                    <View className="items-end gap-0.5">
                      <Text className="text-emerald-400 text-[10px] font-black">
                        +₹{item.inc.toLocaleString("en-IN")}
                      </Text>
                      <Text className="text-rose-500 text-[10px] font-black">
                        -₹{item.exp.toLocaleString("en-IN")}
                      </Text>
                    </View>

                    <View
                      className={`px-2.5 py-1.5 rounded-lg min-w-17.5 items-center ${isPositive ? "bg-emerald-950/30 border border-emerald-500/20" : "bg-rose-950/30 border border-rose-500/20"}`}
                    >
                      <Text className="text-slate-500 text-[7px] font-bold uppercase tracking-wide mb-0.5">
                        Net
                      </Text>
                      <Text
                        className={`text-[10px] font-black tracking-tight ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {isPositive ? "" : "-"}₹
                        {Math.abs(balance).toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 🚀 6. CATEGORY EXPENDITURE BREAKDOWN TRACKS */}
        <View className="bg-slate-950 border border-slate-900 rounded-2xl p-4 shadow-xl mb-4">
          <View className="flex-row items-center gap-2 mb-4 pb-2 border-b border-slate-900">
            <Ionicons name="pie-chart" size={13} color="#ffb703" />
            <Text className="text-white text-xs font-black uppercase tracking-wider">
              Category Distribution
            </Text>
          </View>

          {metrics.categoryBreakdownList.length === 0 ? (
            <Text className="text-slate-500 text-xs font-bold text-center py-4">
              No expenditures recorded in this period.
            </Text>
          ) : (
            <View className="gap-4">
              {metrics.categoryBreakdownList.map((category) => (
                <View key={category.name} className="w-full">
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-white text-xs font-black capitalize tracking-tight">
                      {category.name}
                    </Text>
                    <Text className="text-rose-400 text-xs font-black">
                      -₹{category.amount.toLocaleString("en-IN")}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                      <View
                        style={{ width: `${category.percentage}%` }}
                        className="h-full bg-rose-500 rounded-full"
                      />
                    </View>
                    <Text className="text-slate-400 text-[10px] font-black min-w-7 text-right">
                      {Math.round(category.percentage)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {showPicker.visible && (
          <DateTimePicker
            value={showPicker.target === "start" ? customStart : customEnd}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={today}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
