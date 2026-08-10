import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFinanceStore } from "@/store/useFinanceStore";
import { Ionicons } from "@expo/vector-icons";

// Helper type definitions for typescript safety
interface Transaction {
  id: string;
  amount: number;
  bankId: string;
  categoryType: string;
  dateTime: string;
  refNote: string;
  type: "credit" | "debit" | "transfer";
  targetBankId?: string;
}

interface SectionData {
  title: string;
  data: Transaction[];
}

export default function LedgerScreen() {
  // 1. Fetch live Zustand Store elements
  const transactions = useFinanceStore(
    (state) => state.transactions,
  ) as Transaction[];
  const banks = useFinanceStore((state) => state.banks) || [];
  const categories = useFinanceStore((state) => state.categories) || [];
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction);

  // 2. State controls for searching & filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<
    "all" | "credit" | "debit" | "transfer"
  >("all");
  const [selectedBankId, setSelectedBankId] = useState<string>("all");
  // 🔄 Structural layout visibility toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 🔍 Advanced tracking targets
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateRangePreset, setDateRangePreset] = useState<
    "all" | "this_month" | "3_months" | "9_months" | "custom"
  >("all");

  // 🗓️ Custom Date Boundary trackers
  const [fromDate, setFromDate] = useState<Date>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)),
  ); // Default to 1 month ago
  const [toDate, setToDate] = useState<Date>(new Date());

  // 🎛️ Picker visibility controls
  const [activePicker, setActivePicker] = useState<"none" | "from" | "to">(
    "none",
  );

  // 3. Dynamic Calculation: Filter & calculate summary statistics simultaneously
  // const { filteredTransactions, summary } = useMemo(() => {
  //   let income = 0;
  //   let expenses = 0;

  //   const filtered = transactions.filter((tx) => {
  //     // Filter A: Search Match (against reference note or category title)
  //     const matchesSearch =
  //       tx.refNote.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       tx.categoryType.toLowerCase().includes(searchQuery.toLowerCase());

  //     // Filter B: Transaction Type Match (Credit / Debit / Transfer)
  //     const matchesType =
  //       selectedType === "all" ? true : tx.type === selectedType;

  //     // Filter C: Bank Match (Check either source bank or destination target bank)
  //     const matchesBank =
  //       selectedBankId === "all"
  //         ? true
  //         : tx.bankId === selectedBankId || tx.targetBankId === selectedBankId;

  //     const matches = matchesSearch && matchesType && matchesBank;

  //     // If matched, aggregate values into our active summary sheet
  //     if (matches) {
  //       if (tx.type === "credit") {
  //         income += tx.amount;
  //       } else if (tx.type === "debit") {
  //         expenses += tx.amount;
  //       }
  //     }

  //     return matches;
  //   });

  //   return {
  //     filteredTransactions: filtered,
  //     summary: { income, expenses, net: income - expenses },
  //   };
  // }, [transactions, searchQuery, selectedType, selectedBankId]);

  const { filteredTransactions, summary } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    const filtered = transactions.filter((tx) => {
      // 1. Text Search Match
      const matchesSearch =
        tx.refNote.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.categoryType.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Transaction Type Match
      const matchesType =
        selectedType === "all" ? true : tx.type === selectedType;

      // 3. Bank Account Profile Match
      const matchesBank =
        selectedBankId === "all"
          ? true
          : tx.bankId === selectedBankId || tx.targetBankId === selectedBankId;

      // 4. 🚀 NEW: Dynamic Category Match
      const matchesCategory =
        selectedCategory === "all"
          ? true
          : tx.categoryType.toLowerCase() === selectedCategory.toLowerCase();

      // 5. 🚀 NEW: Chronological Date Range Presets Match
      // let matchesDate = true;
      // const txDate = new Date(tx.dateTime);

      // if (dateRangePreset === "this_month") {
      //   matchesDate =
      //     txDate.getMonth() === now.getMonth() &&
      //     txDate.getFullYear() === now.getFullYear();
      // } else if (dateRangePreset === "3_months") {
      //   const threeMonthsAgo = new Date();
      //   threeMonthsAgo.setMonth(now.getMonth() - 3);
      //   matchesDate = txDate >= threeMonthsAgo;
      // } else if (dateRangePreset === "9_months") {
      //   const nineMonthsAgo = new Date();
      //   nineMonthsAgo.setMonth(now.getMonth() - 9);
      //   matchesDate = txDate >= nineMonthsAgo;
      // }
      // 5. Chronological Date Range Presets & Custom Boundaries Match
      let matchesDate = true;
      const txDate = new Date(tx.dateTime);

      if (dateRangePreset === "this_month") {
        const now = new Date();
        matchesDate =
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear();
      } else if (dateRangePreset === "3_months") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(new Date().getMonth() - 3);
        matchesDate = txDate >= threeMonthsAgo;
      } else if (dateRangePreset === "9_months") {
        const nineMonthsAgo = new Date();
        nineMonthsAgo.setMonth(new Date().getMonth() - 9);
        matchesDate = txDate >= nineMonthsAgo;
      } else if (dateRangePreset === "custom") {
        // 🚀 Strip out hours to ensure precise day boundaries are verified accurately
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = txDate >= start && txDate <= end;
      }

      const matchesAllCriteria =
        matchesSearch &&
        matchesType &&
        matchesBank &&
        matchesCategory &&
        matchesDate;

      // Aggregate dynamic values if the item satisfies all active filters
      if (matchesAllCriteria) {
        if (tx.type === "credit") {
          income += tx.amount;
        } else if (tx.type === "debit") {
          expenses += tx.amount;
        }
      }

      return matchesAllCriteria;
    });

    return {
      filteredTransactions: filtered,
      summary: { income, expenses, net: income - expenses },
    };
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedBankId,
    selectedCategory,
    dateRangePreset,
    fromDate,
    toDate,
  ]);

  // 4. Chronological Daily Sectioning Parser
  const sections: SectionData[] = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    // Sort active filtered pool chronological: Latest First
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    );

    sorted.forEach((tx) => {
      const dateObj = new Date(tx.dateTime);

      // Build a localized structural string key: "July 15, 2026"
      const dateString = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      // Calculate relative string overlays ("Today", "Yesterday")
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let key = dateString;
      if (dateObj.toDateString() === today.toDateString()) {
        key = "Today";
      } else if (dateObj.toDateString() === yesterday.toDateString()) {
        key = "Yesterday";
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    });

    return Object.keys(groups).map((key) => ({
      title: key,
      data: groups[key],
    }));
  }, [filteredTransactions]);

  // 5. Transaction Deletion Guard
  const handleDelete = (id: string, note: string) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${note || "this transaction"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(id),
        },
      ],
    );
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <View className="flex-1 bg-[#000000] p-4">
        {/* 🏛️ HEADER BLOCK */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-emerald-500 text-xl font-black tracking-wider">
              Ledger Books
            </Text>
            {/* <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">
              Chronological Audit Trail
            </Text> */}
          </View>
          <View className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
            <Text className="text-[10px] font-extrabold text-emerald-400 uppercase">
              {filteredTransactions.length} Txs found
            </Text>
          </View>
        </View>

        {/* 🔍 FILTER MATRIX FRAMEWORK */}
        <View className="bg-slate-950/80 rounded-2xl border border-slate-900 p-3 mb-4 gap-3">
          {/* Main Control Input Row */}
          <View className="flex-row items-center gap-2">
            {/* Search Box */}
            <View className="flex-1 flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
              <Ionicons
                name="search"
                size={14}
                color="#64748b"
                className="mr-2"
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search ledger entries..."
                placeholderTextColor="#475569"
                className="flex-1 text-white text-xs font-semibold p-0 m-0"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={14} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* ⚡ ADVANCED FILTER TRIGGER TOGGLE BUTTON */}
            <TouchableOpacity
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2.5 rounded-xl border items-center justify-center ${
                showAdvancedFilters
                  ? "bg-emerald-500/10 border-emerald-500/40"
                  : "bg-slate-900 border-slate-800 active:bg-slate-800"
              }`}
            >
              <Ionicons
                name={showAdvancedFilters ? "funnel" : "funnel-outline"}
                size={14}
                color={showAdvancedFilters ? "#10b981" : "#64748b"}
              />
            </TouchableOpacity>
          </View>

          {/* Segmented Transaction Type Tabs */}
          <View className="flex-row bg-slate-900 p-1 rounded-xl gap-1">
            {(["all", "credit", "debit", "transfer"] as const).map((type) => {
              const isActive = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                    isActive
                      ? "bg-slate-800 border border-slate-700/50"
                      : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-emerald-400" : "text-slate-500"}`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Standard Bank Filter Track */}
          <View className="flex-row items-center">
            <Ionicons
              name="business-outline"
              size={11}
              color="#64748b"
              className="mr-2"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
            >
              <TouchableOpacity
                onPress={() => setSelectedBankId("all")}
                className={`px-3 py-1 rounded-full mr-2 border ${selectedBankId === "all" ? "bg-slate-800 border-slate-700" : "bg-slate-900 border-slate-800/80"}`}
              >
                <Text
                  className={`text-[9px] font-bold uppercase ${selectedBankId === "all" ? "text-emerald-400" : "text-slate-400"}`}
                >
                  All Accounts
                </Text>
              </TouchableOpacity>
              {banks.map((bank: any) => (
                <TouchableOpacity
                  key={bank.id}
                  onPress={() => setSelectedBankId(bank.id)}
                  className={`px-3 py-1 rounded-full mr-2 border ${selectedBankId === bank.id ? "bg-slate-800 border-slate-700" : "bg-slate-900 border-slate-800/80"}`}
                >
                  <Text
                    className={`text-[9px] font-bold uppercase ${selectedBankId === bank.id ? "text-emerald-400" : "text-slate-400"}`}
                  >
                    {bank.bankName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* 👑 EXPANDABLE ADVANCED OPTIONS GRID */}
          {showAdvancedFilters && (
            <View className="border-t border-slate-900 pt-3 gap-3">
              {/* A. Category Filter Strip */}
              <View className="flex-row items-center">
                <Ionicons
                  name="pricetag-outline"
                  size={11}
                  color="#64748b"
                  className="mr-2"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-1"
                >
                  <TouchableOpacity
                    onPress={() => setSelectedCategory("all")}
                    className={`px-3 py-1 rounded-full mr-2 border ${selectedCategory === "all" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900 border-slate-800"}`}
                  >
                    <Text
                      className={`text-[9px] font-bold uppercase ${selectedCategory === "all" ? "text-emerald-400" : "text-slate-400"}`}
                    >
                      All Categories
                    </Text>
                  </TouchableOpacity>
                  {categories.map((cat: any) => (
                    <TouchableOpacity
                      key={cat.name}
                      onPress={() => setSelectedCategory(cat.name)}
                      className={`px-3 py-1 rounded-full mr-2 border ${selectedCategory === cat.name ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900 border-slate-800"}`}
                    >
                      <Text
                        className={`text-[9px] font-bold uppercase ${selectedCategory === cat.name ? "text-emerald-400" : "text-slate-400"}`}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* B. Date Range Presets Track */}
              {/* <View className="flex-row items-center">
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color="#64748b"
                  className="mr-2"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-1"
                >
                  {[
                    { id: "all", label: "All Time" },
                    { id: "this_month", label: "This Month" },
                    { id: "3_months", label: "Last 3 Months" },
                    { id: "9_months", label: "Last 9 Months" },
                  ].map((preset) => {
                    const isSelected = dateRangePreset === preset.id;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        onPress={() => setDateRangePreset(preset.id as any)}
                        className={`px-3 py-1 rounded-full mr-2 border ${isSelected ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900 border-slate-800"}`}
                      >
                        <Text
                          className={`text-[9px] font-bold uppercase ${isSelected ? "text-emerald-400" : "text-slate-400"}`}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View> */}
              {/* B. Date Range Presets & Custom Pickers Track */}
              <View className="gap-2.5">
                <View className="flex-row items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={11}
                    color="#64748b"
                    className="mr-2"
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-1"
                  >
                    {[
                      { id: "all", label: "All Time" },
                      { id: "this_month", label: "This Month" },
                      { id: "3_months", label: "Last 3 Months" },
                      { id: "9_months", label: "Last 9 Months" },
                      { id: "custom", label: "📆 Custom Range" }, // 🚀 Custom Toggle Choice
                    ].map((preset) => {
                      const isSelected = dateRangePreset === preset.id;
                      return (
                        <TouchableOpacity
                          key={preset.id}
                          onPress={() => {
                            setDateRangePreset(preset.id as any);
                            if (preset.id !== "custom") setActivePicker("none");
                          }}
                          className={`px-3 py-1 rounded-full mr-2 border ${isSelected ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900 border-slate-800"}`}
                        >
                          <Text
                            className={`text-[9px] font-bold uppercase ${isSelected ? "text-emerald-400" : "text-slate-400"}`}
                          >
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* 🚀 NEW: Dynamic Custom Date Selector Pills Panel */}
                {dateRangePreset === "custom" && (
                  <View className="flex-row gap-2 pl-5 mt-1 animate-fade-in">
                    {/* From Selector */}
                    <TouchableOpacity
                      onPress={() => setActivePicker("from")}
                      className={`flex-1 flex-row items-center justify-between px-3 py-1.5 rounded-xl border ${activePicker === "from" ? "bg-slate-800 border-emerald-500/50" : "bg-slate-900 border-slate-800"}`}
                    >
                      <Text className="text-[8px] font-black text-slate-500 uppercase">
                        From:
                      </Text>
                      <Text className="text-[10px] font-bold text-white">
                        {fromDate.toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </Text>
                    </TouchableOpacity>

                    {/* To Selector */}
                    <TouchableOpacity
                      onPress={() => setActivePicker("to")}
                      className={`flex-1 flex-row items-center justify-between px-3 py-1.5 rounded-xl border ${activePicker === "to" ? "bg-slate-800 border-emerald-500/50" : "bg-slate-900 border-slate-800"}`}
                    >
                      <Text className="text-[8px] font-black text-slate-500 uppercase">
                        To:
                      </Text>
                      <Text className="text-[10px] font-bold text-white">
                        {toDate.toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Native Overlay Component Portal */}
              {activePicker !== "none" && (
                <DateTimePicker
                  value={activePicker === "from" ? fromDate : toDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()} // Block future data inputs
                  onChange={(event, currentSelectedDate) => {
                    if (Platform.OS === "android") setActivePicker("none"); // Android specific layout hide fix

                    if (currentSelectedDate) {
                      if (activePicker === "from") {
                        setFromDate(currentSelectedDate);
                      } else {
                        // Validation Guardrail: Ensure the end date cannot be set before the start date
                        if (currentSelectedDate < fromDate) {
                          Alert.alert(
                            "Invalid Range",
                            "End date cannot occur before your selected start date.",
                          );
                        } else {
                          setToDate(currentSelectedDate);
                        }
                      }
                    }
                  }}
                />
              )}
            </View>
          )}
        </View>

        {/* 📊 DYNAMIC FILTER STATEMENT SUMMARY STRIP */}
        <View className="flex-row items-center justify-between bg-slate-700 border border-slate-900 rounded-xl p-3 mb-4">
          <View className="items-center flex-1 border-r border-slate-900">
            <Text className="text-[8px] uppercase tracking-wider text-slate-300 font-black mb-0.5">
              Inflow
            </Text>
            <Text className="text-xs font-black text-emerald-400">
              +₹{summary.income.toLocaleString("en-IN")}
            </Text>
          </View>
          <View className="items-center flex-1 border-r border-slate-900">
            <Text className="text-[8px] uppercase tracking-wider text-slate-300 font-black mb-0.5">
              Outflow
            </Text>
            <Text className="text-xs font-black text-rose-500">
              -₹{summary.expenses.toLocaleString("en-IN")}
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-[8px] uppercase tracking-wider text-slate-300 font-black mb-0.5">
              Net Flow
            </Text>
            <Text
              className={`text-xs font-black ${summary.net >= 0 ? "text-emerald-400" : "text-rose-500"}`}
            >
              {summary.net >= 0 ? "+" : ""}₹
              {summary.net.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {/* 📅 HISTORICAL CHRONOLOGICAL SECTION LIST */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
              <Ionicons
                name="receipt-outline"
                size={32}
                color="#475569"
                className="mb-2"
              />
              <Text className="text-slate-400 text-xs font-bold text-center">
                No transactions recorded here yet.
              </Text>
              <Text className="text-slate-600 text-[10px] text-center mt-1">
                Tap the add button to log your expenses.
              </Text>
            </View>
          }
          // 1. 🏷️ STICKY FLOATING DATE ROW DESIGN
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-[#000000] pt-4 pb-2 z-10">
              <View className="flex-row items-center gap-2">
                {/* Floating Indicator Bubble */}
                <View className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 rounded-full">
                  <Text className="text-[10px] font-black text-emerald-400 tracking-widest">
                    {title}
                  </Text>
                </View>

                {/* Sleek Horizontal Connector Line */}
                <View className="flex-1 h-px bg-slate-900" />

                {/* Expand/Collapse Dropdown indicator aesthetic */}
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color="#475569"
                  className="mr-1"
                />
              </View>
            </View>
          )}
          // 2. 📦 INTERMEDIATE CONTAINER LIST RENDERER
          renderItem={({ item, index, section }) => {
            const isCredit = item.type === "credit";
            const isTransfer = item.type === "transfer";

            let amountColor = isCredit ? "text-emerald-400" : "text-rose-500";
            let prefix = isCredit ? "+ " : "- ";

            if (isTransfer) {
              amountColor = "text-sky-400";
              prefix = "";
            }

            // Resolve store-backed category assets
            const matchedCat = categories.find(
              (c) => c.name.toLowerCase() === item.categoryType.toLowerCase(),
            );
            const catIcon = isTransfer
              ? "swap-horizontal"
              : matchedCat?.icon || "receipt";
            const catBg = isTransfer
              ? "bg-sky-950/40"
              : matchedCat?.bg || "bg-slate-900";
            const catColor = isTransfer
              ? "text-sky-400"
              : matchedCat?.text || "text-slate-400";

            const sourceBankName =
              banks.find((b) => b.id === item.bankId)?.bankName || "Unknown";
            const destinationBankName = item.targetBankId
              ? banks.find((b) => b.id === item.targetBankId)?.bankName ||
                "Unknown"
              : "";

            // Dynamic styling calculation to group rows inside a single box
            const isFirst = index === 0;
            const isLast = index === section.data.length - 1;

            return (
              <View
                className={`bg-slate-800/40 border border-slate-600 px-4 py-3.5 flex-row items-center justify-between
          ${isFirst ? "rounded-t-2xl border-t pt-4" : ""}
          ${isLast ? "rounded-b-2xl border-b pb-4 mb-2" : "border-b border-b-slate-900/40"}
        `}
              >
                {/* Left Side Details */}
                <View className="flex-row items-center gap-3.5 flex-1">
                  {/* Category Symbol */}

                  <View className="items-center justify-center w-12">
                    <View
                      className={`p-2 rounded-xl items-center justify-center mb-1 ${catBg} border border-slate-800/60 shadow-sm`}
                    >
                      <Ionicons
                        name={catIcon as any}
                        size={14}
                        className={catColor}
                      />
                    </View>
                    <Text
                      className="text-slate-500 text-[9px] font-bold tracking-wider text-center w-full"
                      numberOfLines={1}
                    >
                      {item.categoryType}
                    </Text>
                  </View>

                  {/* Core Info Metadata Stack */}
                  <View className="flex-1 pr-1 gap-2">
                    <Text
                      className="text-white font-bold text-sm"
                      numberOfLines={1}
                    >
                      {item.refNote || "No Reference Note"}
                    </Text>

                    <View className="flex-row items-end gap-4 mt-1">
                      <Text className="text-slate-600 text-[8px] font-bold">
                        {new Date(item.dateTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </Text>

                      <View className="px-1.5 py-0.5 rounded bg-slate-900 border border-sky-800">
                        <Text className="text-slate-400 text-[7px] font-black uppercase tracking-wider">
                          {isTransfer
                            ? `${sourceBankName} → ${destinationBankName}`
                            : sourceBankName}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Right Side Controls */}
                <View className="flex-row items-center gap-3.5 pl-2">
                  <Text
                    className={`font-black text-xs tracking-tight ${amountColor}`}
                  >
                    {prefix}₹{Number(item.amount).toLocaleString("en-IN")}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.refNote)}
                    className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg active:bg-rose-500/20"
                  >
                    <Ionicons name="trash-outline" size={11} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}
