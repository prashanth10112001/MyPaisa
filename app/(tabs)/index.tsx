import { useFinanceStore } from "@/store/useFinanceStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const banks = useFinanceStore((state) => state.banks);
  const categories = useFinanceStore((state) => state.categories);
  const transactions = useFinanceStore((state) => state.transactions);

  const [currentBankIndex, setCurrentBankIndex] = useState(0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const isAllAccountsView = currentBankIndex === 0 || banks.length === 0;
  const activeBank = !isAllAccountsView ? banks[currentBankIndex - 1] : null;

  const computedMetrics = transactions.reduce(
    (acc, tx) => {
      const txDate = new Date(tx.dateTime);
      const isToday = txDate >= todayStart && txDate <= todayEnd;

      // Filter: Check if transaction belongs to the currently visible bank layout view
      const matchesBank =
        isAllAccountsView ||
        tx.bankId === activeBank?.id ||
        (tx.type === "transfer" && tx.targetBankId === activeBank?.id);

      if (!matchesBank) return acc;

      // Handle calculations from "Your Pocket's Perspective"
      if (tx.type === "credit") {
        acc.netBalance += tx.amount;
        if (isToday) acc.todayCredit += tx.amount;
      } else if (tx.type === "debit") {
        acc.netBalance -= tx.amount;
        if (isToday) acc.todayDebit += tx.amount;
      } else if (tx.type === "transfer") {
        // 🔄 Self-Transfers modify local balances, but are net-neutral on the combined global scale!
        if (!isAllAccountsView) {
          if (tx.bankId === activeBank?.id) {
            acc.netBalance -= tx.amount; // Sent out from this specific bank
            if (isToday) acc.todayDebit += tx.amount;
          }
          if (tx.targetBankId === activeBank?.id) {
            acc.netBalance += tx.amount; // Received into this specific bank
            if (isToday) acc.todayCredit += tx.amount;
          }
        }
      }

      return acc;
    },
    { netBalance: 0, todayCredit: 0, todayDebit: 0 },
  );

  // 5. Navigation handling functions for the buttons
  const handlePrev = () => {
    setCurrentBankIndex((prev) => (prev === 0 ? banks.length : prev - 1));
  };

  const handleNext = () => {
    setCurrentBankIndex((prev) => (prev === banks.length ? 0 : prev + 1));
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <View className="flex-1 bg-[#000000] p-4">
        {/* This is for name and profile icon */}
        <View className="flex-row items-center justify-between ">
          <Text className="text-white text-xl font-extrabold tracking-wider">
            Hey, <Text className="text-sky-500">Durgam Prashanth</Text>
          </Text>
          <TouchableOpacity
            className="rounded-full p-3 bg-amber-50 items-center justify-center"
            onPress={() => router.navigate("/profile")}
          >
            <Ionicons name="person" size={18} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Main Hero Card */}
        <View className="bg-slate-950 border border-slate-800 rounded-2xl p-4 my-4 shadow-xl">
          {/* Header: Navigation & Net Balance */}
          <View className="flex-row items-center justify-between mb-6">
            {/* Left Arrow Button */}
            <TouchableOpacity
              onPress={handlePrev}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 active:bg-slate-800"
            >
              <Ionicons name="caret-back" size={14} color="#10b981" />
            </TouchableOpacity>

            {/* Center Financial Balance Block */}
            <View className="items-center gap-1 flex-1">
              {/* Dynamic Bank Badge Wrapper */}
              <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 mb-1">
                <Ionicons
                  name={isAllAccountsView ? "wallet" : "business"}
                  size={12}
                  color="#10b981"
                />
                <Text className="text-slate-300 text-xs font-bold uppercase tracking-wider">
                  {isAllAccountsView ? "All Accounts" : activeBank?.bankName}
                </Text>
              </View>

              <Text className="text-slate-400 font-medium text-xs uppercase tracking-widest">
                Net Balance
              </Text>

              <Text
                className={`text-3xl font-black tracking-tight ${computedMetrics.netBalance >= 0 ? "text-emerald-400" : "text-rose-500"}`}
              >
                ₹ {computedMetrics.netBalance.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* Right Arrow Button */}
            <TouchableOpacity
              onPress={handleNext}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 active:bg-slate-800"
            >
              <Ionicons name="caret-forward" size={14} color="#10b981" />
            </TouchableOpacity>
          </View>

          {/* Footer Section: Today's Dynamic Debit and Credit values */}
          <View className="flex-row items-center justify-between border-t border-slate-800 relative pt-4 pb-1">
            {/* Left Section: Credited */}
            <View className="flex-1 items-center border-r border-slate-900 py-1">
              <Text className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Credited
              </Text>
              <Text className="text-base font-extrabold text-emerald-400">
                ₹ {computedMetrics.todayCredit.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* Center Floating Badge */}
            <View className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full shadow-md">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Today
              </Text>
            </View>

            {/* Right Section: Debited */}
            <View className="flex-1 items-center py-1">
              <Text className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Debited
              </Text>
              <Text className="text-base font-extrabold text-rose-500">
                ₹ {computedMetrics.todayDebit.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}

        <View className="flex-1 mt-2">
          {/* Header Title Section Control Row */}
          <View className="flex-row items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <Text className="text-white font-extrabold text-base tracking-wide">
              {isAllAccountsView
                ? "Recent Transactions"
                : "Account Ledger History"}
            </Text>
            <View className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full">
              <Text className="text-[10px] font-bold text-emerald-400 tracking-wider">
                {
                  transactions.filter(
                    (tx) =>
                      isAllAccountsView ||
                      tx.bankId === activeBank?.id ||
                      tx.targetBankId === activeBank?.id,
                  ).length
                }{" "}
                items
              </Text>
            </View>
          </View>

          {/* Transactions FlatList Core Portal */}
          <FlatList
            showsVerticalScrollIndicator={false}
            // 🚀 Dynamic Pre-flight Filter Matrix based on the Hero Card state selection
            data={transactions
              .filter((tx) => {
                if (isAllAccountsView) return true;
                // Keep item if it matches the current focused sender OR receiver account index key
                return (
                  tx.bankId === activeBank?.id ||
                  tx.targetBankId === activeBank?.id
                );
              })

              // Chronological sort layout driver: Newest ledger events sit permanently at the top
              .sort(
                (a, b) =>
                  new Date(b.dateTime).getTime() -
                  new Date(a.dateTime).getTime(),
              )}
            keyExtractor={(item) => item.id}
            // Fallback UI Presentation layer if zero transactional history exists
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
            renderItem={({ item }) => {
              // 1. Resolve Dynamic Aesthetic Settings from Zustand Category Map
              const matchedCat = categories.find(
                (c) => c.name.toLowerCase() === item.categoryType.toLowerCase(),
              );

              // Fallback variables if custom settings aren't parsed out cleanly
              let catIcon = matchedCat?.icon || "receipt";
              let catBg = matchedCat?.bg || "bg-slate-800";
              let catTextColor = matchedCat?.text || "text-slate-400";

              // 2. Compute Prefix Tokens and Color Scales using our Pocket Matrix Rules
              let amountColor = "text-white";
              let prefix = "";

              if (item.type === "credit") {
                amountColor = "text-emerald-400";
                prefix = "+ ";
              } else if (item.type === "debit") {
                amountColor = "text-rose-500";
                prefix = "- ";
              } else if (item.type === "transfer") {
                amountColor = "text-sky-400";
                prefix = "";
                catIcon = "swap-horizontal";
                catBg = "bg-sky-950/40";
                catTextColor = "text-sky-400";
              }

              // 3. Structural Bank Identity Mapping (Resolves dynamic strings like "SBI")
              const sourceBankName =
                banks.find((b) => b.id === item.bankId)?.bankName || "Unknown";
              const destinationBankName = item.targetBankId
                ? banks.find((b) => b.id === item.targetBankId)?.bankName ||
                  "Unknown"
                : "";

              return (
                <View className="flex-row items-center justify-between bg-slate-800/40 border border-slate-900/80  border-b-sky-400 rounded-2xl px-3.5 py-3 mb-2.5 active:bg-slate-600/60 transition-all">
                  <View className="flex-row items-center gap-3.5 flex-1">
                    <View className="items-center justify-center w-12">
                      <View
                        className={`p-2 rounded-xl items-center justify-center mb-1 ${catBg} border border-slate-800/60 shadow-sm`}
                      >
                        <Ionicons
                          name={catIcon as any}
                          size={14}
                          className={catTextColor}
                        />
                      </View>
                      <Text
                        className="text-slate-500 text-[9px] font-bold tracking-wider text-center w-full"
                        numberOfLines={1}
                      >
                        {item.categoryType}
                      </Text>
                    </View>

                    <View className="flex-1 gap-2 py-0.5">
                      <Text
                        className="text-slate-100 font-bold text-sm tracking-tight leading-tight"
                        numberOfLines={1}
                      >
                        {item.refNote || "Cash Transaction"}
                      </Text>

                      {/* Context Tag Tracker Row */}
                      <View className="flex-row items-end gap-4 mt-auto">
                        {/* Time Indicator Timestamp */}
                        <Text className="text-slate-600 font-semibold text-[9px] tracking-widest">
                          {new Date(item.dateTime).toLocaleDateString(
                            undefined,
                            { day: "numeric", month: "short" },
                          )}{" "}
                          •{" "}
                          {new Date(item.dateTime).toLocaleTimeString(
                            undefined,
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </Text>

                        {/* Account Source Track Pill Badge */}
                        <View className="px-1.5 py-0.5 rounded bg-slate-950 border border-sky-800 flex-row items-center">
                          <Text className="text-slate-400 font-extrabold text-[8px] uppercase tracking-wider">
                            {item.type === "transfer"
                              ? `${sourceBankName} → ${destinationBankName}`
                              : sourceBankName}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Right Side: Dynamic Formatted Cash Value */}
                  <View className="items-end justify-center pl-2">
                    <Text
                      className={`font-black text-sm tracking-tight ${amountColor}`}
                    >
                      {prefix}₹{Number(item.amount).toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
