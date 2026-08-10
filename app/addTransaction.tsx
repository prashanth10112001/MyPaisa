import {
  AVAILABLE_ICONS,
  TRANSACTION_TYPES,
} from "@/constants/AddTransactions";
import { useFinanceStore } from "@/store/useFinanceStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const CATEGORIES = [
  {
    id: "6",
    name: "Salary",
    icon: "wallet",
    color: "bg-emerald-100 text-emerald-600",
  },
  {
    id: "1",
    name: "Food",
    icon: "fast-food",
    color: "bg-orange-100 text-orange-600",
  },

  {
    id: "2",
    name: "Shopping",
    icon: "basket",
    color: "bg-pink-100 text-pink-600",
  },

  {
    id: "5",
    name: "Entertainment",
    icon: "game-controller",
    color: "bg-red-100 text-red-600",
  },
  { id: "3", name: "Fuel", icon: "car", color: "bg-blue-100 text-blue-600" },
  {
    id: "4",
    name: "Bills",
    icon: "receipt",
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "7",
    name: "Medical",
    icon: "medical",
    color: "bg-rose-100 text-rose-600",
  },

  {
    id: "8",
    name: "Others",
    icon: "ellipsis-horizontal",
    color: "bg-slate-100 text-slate-600",
  },
];

export default function AddTransactionModal() {
  const router = useRouter();

  const banks = useFinanceStore((state) => state.banks);
  const addBank = useFinanceStore((state) => state.addBank);

  const categories = useFinanceStore((state) => state.categories);
  const addCategory = useFinanceStore((state) => state.addCategory);

  const initialPrimaryBank =
    banks.find((b) => b.isPrimary)?.id || (banks[0]?.id ?? "");

  const [selectedBankId, setSelectedBankId] = useState(initialPrimaryBank);
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [newBankName, setNewBankName] = useState("");

  const [selectedType, setSelectedType] = useState("credit");
  const [selectedId, setSelectedId] = useState("1");

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.name || "Others",
  );

  const [isCatModalVisible, setIsCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("gift");

  const [date, setDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<"date" | "time">("date");
  const [show, setShow] = useState<boolean>(false);

  // Add these text input states if you haven't already:
  const [amount, setAmount] = useState("");
  const [refNote, setRefNote] = useState("");

  // 🔄 Dynamic second bank state for transfers (Receiver Account)
  const [targetBankId, setTargetBankId] = useState("");
  const addTransaction = useFinanceStore((state) => state.addTransaction);

  // Helper handling routine for opening your user input prompt framework
  const handleBankSubmit = () => {
    const trimmedName = newBankName.trim();

    if (!trimmedName) {
      Alert.alert("Error", "Bank name connot be empty.");
      return;
    }

    addBank(trimmedName);

    setTimeout(() => {
      const currentBanks = useFinanceStore.getState().banks;
      const newlyCreatedBank = currentBanks.find(
        (b) => b.bankName === trimmedName.toUpperCase(),
      );
      if (newlyCreatedBank) {
        setSelectedBankId(newlyCreatedBank.id);
      }
    }, 50);

    setNewBankName("");
    setIsBankModalVisible(false);
  };

  const handleCategorySubmit = () => {
    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Category name cannot be empty.");
      return;
    }

    // Add to permanent local storage via Zustand
    addCategory(trimmedName, selectedIcon);

    // Auto-select the newly created category token
    setSelectedCategoryId(trimmedName);

    // Reset Form Lifecycles
    setNewCatName("");
    setSelectedIcon("gift");
    setIsCatModalVisible(false);
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Android requires manually hiding the picker after a selection
    if (Platform.OS === "android") {
      setShow(false);
    }

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const showMode = (currentMode: "date" | "time") => {
    setMode(currentMode);
    setShow(true);
  };

  const handleSaveTransaction = () => {
    // --- STEP 1: Core Form Field Validations ---
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount greater than 0.",
      );
      return;
    }

    if (!refNote.trim()) {
      Alert.alert(
        "Missing Details",
        "Please add a brief reference note or description.",
      );
      return;
    }

    // --- STEP 2: Structural Account Availability Check ---
    if (banks.length === 0) {
      Alert.alert(
        "No Accounts Found",
        "You cannot create a transaction without a bank account profile. Please click 'Add' in the account section first.",
      );
      return;
    }

    if (!selectedBankId) {
      Alert.alert(
        "Selection Required",
        "Please tap and select an active account.",
      );
      return;
    }

    // --- STEP 3: Self-Transfer Fallback Guardrails ---
    if (selectedType === "transfer") {
      if (banks.length < 2) {
        Alert.alert(
          "Action Blocked",
          "Self-Transfers require at least TWO distinct bank accounts. Please create another bank profile first.",
        );
        return;
      }

      if (!targetBankId) {
        Alert.alert(
          "Selection Required",
          "Please select a destination account for this transfer.",
        );
        return;
      }

      if (selectedBankId === targetBankId) {
        Alert.alert(
          "Invalid Transfer",
          "Source account and destination account cannot be identical. Please choose two different banks.",
        );
        return;
      }
    }

    // --- STEP 4: Package Payload & Dispatch to Zustand Storage ---
    addTransaction({
      amount: parsedAmount,
      type: selectedType as "credit" | "debit" | "transfer",
      categoryType:
        selectedType === "transfer" ? "Transfer" : selectedCategoryId,
      bankId: selectedBankId,
      // Safely assign targetBankId only if it's a transfer type
      ...(selectedType === "transfer" && { targetBankId }),
      refNote: refNote.trim(),
      dateTime: date.toISOString(), // Standardizing formatting structure for JSON persistence compatibility
    });

    // --- STEP 5: Success Navigation Lifecycle ---
    Alert.alert("Success 🎉", "Transaction recorded successfully!", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    // 🌌 Clicking this outer dark backdrop dimming area closes the sheet
    <TouchableWithoutFeedback onPress={() => router.back()}>
      <View className="flex-1 bg-black/40 justify-end">
        {/* 🛑 Prevent clicks inside the panel from accidentally closing it */}
        <TouchableWithoutFeedback>
          {/* 📐 Set your exact custom height percentage or pixels here */}
          <View className="bg-[#181717] rounded-t-3xl p-6 shadow-xl border-r border-l border-t border-[#10b981]">
            {/* Minimal handle bar decoration indicator to hint slide down */}
            <TouchableOpacity onPress={() => router.back()}>
              <View className="w-12 h-1 bg-slate-200 rounded-full align-self-center mx-auto mb-5" />
            </TouchableOpacity>
            {/* Header elements matching Screen 3 layout */}
            <View className="flex-row justify-between items-center mb-6 border-b border-slate-600 pb-2">
              <Text className="text-xl font-bold text-white">
                Add Transaction
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="p-2 bg-slate-100 rounded-full"
              >
                <Ionicons name="close" size={15} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* This is amount and ref note section */}
            <View className="bg-[#000000] border-dashed border border-white rounded-2xl pt-2 px-4 mb-4">
              <View className="flex-row items-center justify-center">
                <Text className="text-4xl font-extrabold text-emerald-500 mr-2 select-none">
                  ₹
                </Text>

                <TextInput
                  value={amount}
                  onChangeText={(text) => {
                    const sanitizedText = text.replace(/[^0-9.]/g, "");

                    // Prevent entering more than one decimal point
                    if ((sanitizedText.match(/\./g) || []).length <= 1) {
                      setAmount(sanitizedText);
                    }
                  }}
                  className="text-5xl font-extrabold text-white min-w-25"
                  placeholder="0"
                  placeholderTextColor="#475569"
                  keyboardType="decimal-pad"
                  autoFocus={true}
                  maxLength={10}
                />
              </View>

              <View className="flex-row items-center gap-2 my-2">
                <Text className="font-black text-sm text-[#10b981] tracking-wide">
                  Ref Note :
                </Text>
                <TextInput
                  value={refNote}
                  onChangeText={setRefNote}
                  multiline={true}
                  numberOfLines={2}
                  className="flex-1 text-xs font-semibold text-white "
                  // placeholder="Used at RMart, used for bank"
                  placeholder="e.g. Grocery shopping at RMart, electrical bill"
                  placeholderTextColor="#475569"
                  maxLength={80}
                  style={{ textAlignVertical: "top" }}
                />
              </View>
            </View>

            {/* This is the type of account */}
            <View className="gap-1 mb-4">
              <View className="border-b border-slate-600 pb-2">
                <Text className="text-white font-extrabold">Account :</Text>
              </View>

              <View className="flex-row items-center mt-2">
                <FlatList
                  data={banks}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  contentContainerClassName="gap-2 px-0.5 py-1 items-center"
                  renderItem={({ item }) => {
                    const isSelected = item.id === selectedBankId;

                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedBankId(item.id)}
                        activeOpacity={0.7}
                        className={`flex-row items-center px-4 py-2 rounded-full border border-transparent transition-all ${
                          isSelected ? "bg-sky-600" : "bg-slate-50"
                        }`}
                      >
                        {/* Left Indicator: Green checkmark when selected, slate business outline when unselected */}
                        <Ionicons
                          name={
                            isSelected ? "checkmark-circle" : "business-outline"
                          }
                          size={14}
                          color={isSelected ? "#10b981" : "#64748b"}
                          style={{ marginRight: 6 }}
                        />

                        {/* Bank Name Label */}
                        <Text
                          className={`text-xs font-bold tracking-tight ${
                            isSelected ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {item.bankName}
                        </Text>

                        {/* 👑 Small indicator badge if it's the primary account */}
                        {item.isPrimary && (
                          <View className="ml-1.5 bg-amber-500 px-1 rounded">
                            <Text className="text-[9px] font-extrabold text-slate-800 uppercase tracking-tighter">
                              P
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <Text className="text-xs  text-slate-500 mr-2 py-2">
                      No accounts added yet.
                    </Text>
                  }
                  /* 🚀 FIX: The permanent "Add Bank" button, anchored at the end of the track */
                  ListFooterComponent={
                    <TouchableOpacity
                      onPress={() => setIsBankModalVisible(true)}
                      activeOpacity={0.7}
                      className="flex-row items-center px-3 py-2 rounded-full border border-dashed border-slate-500 bg-slate-900/40 active:bg-slate-800"
                    >
                      <Ionicons
                        name="add"
                        size={14}
                        color="#10b981"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="text-xs font-bold text-slate-400">
                        Add
                      </Text>
                    </TouchableOpacity>
                  }
                  ListFooterComponentStyle={{ marginLeft: 4 }}
                />
              </View>
            </View>

            {/* 🔄 CONDITIONAL RECEIVER PICKER: Displays exclusively during a Self-Transfer workspace state */}
            {selectedType === "transfer" && (
              <View className="gap-1 mb-4 animate-fade-in">
                <View className="border-b border-slate-800 pb-2">
                  <Text className="text-sky-400 font-extrabold text-xs tracking-wider uppercase">
                    Transfer To (Destination Account) :
                  </Text>
                </View>

                <View className="flex-row items-center mt-2">
                  <FlatList
                    data={banks.filter((b) => b.id !== selectedBankId)} // Filtering removes the sender bank so they can't pick the same one!
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => `target-${item.id}`}
                    contentContainerClassName="gap-2 px-0.5 py-1 items-center"
                    renderItem={({ item }) => {
                      const isSelected = item.id === targetBankId;
                      return (
                        <TouchableOpacity
                          onPress={() => setTargetBankId(item.id)}
                          activeOpacity={0.7}
                          className={`flex-row items-center px-4 py-2 rounded-full border ${
                            isSelected
                              ? "bg-sky-600 border-transparent"
                              : "bg-slate-900 border-slate-800"
                          }`}
                        >
                          <Ionicons
                            name={
                              isSelected
                                ? "checkmark-circle"
                                : "arrow-forward-circle-outline"
                            }
                            size={14}
                            color={isSelected ? "#10b981" : "#38bdf8"}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-300"}`}
                          >
                            {item.bankName}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                    ListEmptyComponent={
                      <Text className="text-xs italic text-rose-400 mr-2 py-2">
                        ⚠️ Please add a second bank to complete a transfer.
                      </Text>
                    }
                  />
                </View>
              </View>
            )}

            {/* This is the Modal to add Bank */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={isBankModalVisible}
              onRequestClose={() => setIsBankModalVisible(false)}
            >
              <View className="flex-1 justify-end bg-black/60">
                {/* Main Container Card panel */}
                <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 pb-8 shadow-2xl">
                  {/* Header: Title + Close Corner Button */}
                  <View className="flex-row justify-between items-center border-b border-slate-800 pb-3 mb-5">
                    <Text className="text-white text-base font-extrabold tracking-wide">
                      Add New Bank Account
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsBankModalVisible(false)}
                      className="p-1 rounded-full bg-slate-800/60 active:bg-slate-800"
                    >
                      <Ionicons name="close" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>

                  {/* Input Form Field */}
                  <View className="gap-2 mb-6">
                    <Text className="text-slate-400 text-xs font-bold tracking-wider uppercase">
                      Bank Name
                    </Text>
                    <TextInput
                      value={newBankName}
                      onChangeText={setNewBankName}
                      placeholder="e.g. HDFC, SBI, ICICI"
                      placeholderTextColor="#475569"
                      autoCapitalize="characters"
                      maxLength={10}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-sky-500"
                    />
                  </View>

                  {/* Action Dialog Footer Control Matrix */}
                  <View className="flex-row gap-3">
                    {/* Cancel Button */}
                    <TouchableOpacity
                      onPress={() => {
                        setNewBankName("");
                        setIsBankModalVisible(false);
                      }}
                      activeOpacity={0.7}
                      className="flex-1 items-center justify-center py-3.5 rounded-xl border border-slate-800 active:bg-slate-800/40"
                    >
                      <Text className="text-slate-400 text-sm font-bold">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    {/* Submit Button */}
                    <TouchableOpacity
                      onPress={handleBankSubmit}
                      activeOpacity={0.7}
                      className="flex-1 items-center justify-center py-3.5 rounded-xl bg-emerald-500 active:bg-emerald-600 shadow-md"
                    >
                      <Text className="text-slate-950 text-sm font-extrabold">
                        Submit
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* This is the type of payment */}

            <View className="gap-1 mb-4">
              {/* Section Header */}
              <View className="border-b border-slate-800 pb-2">
                <Text className="text-white font-extrabold text-sm tracking-wide">
                  Type :
                </Text>
              </View>

              {/* Compact Selector Row Matrix */}
              <View className="flex-row items-center mt-2 gap-2">
                {TRANSACTION_TYPES.map((type) => {
                  const isSelected = type.id === selectedType;

                  return (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => setSelectedType(type.id)}
                      activeOpacity={0.75}
                      className={`${type.flex} flex-row items-center justify-center px-2 py-2.5 rounded-full border ${
                        isSelected
                          ? `${type.activeBg} border-transparent shadow-sm shadow-black/40`
                          : "bg-slate-50 border-slate-800"
                      }`}
                    >
                      {/* Circular Icon Container */}
                      <View
                        className={`p-1 rounded-full items-center justify-center ${
                          isSelected
                            ? "bg-white/20"
                            : type.iconColor.split(" ")[1]
                        }`}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={13}
                          color={isSelected ? "#ffffff" : undefined}
                          className={
                            isSelected ? "" : type.iconColor.split(" ")[0]
                          }
                        />
                      </View>

                      {/* Action Label */}
                      <Text
                        className={`text-xs font-bold tracking-tight ml-1.5 ${
                          isSelected ? type.activeText : "black"
                        }`}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* this is for selecting category */}
            <View className="gap-1 mb-4">
              <View className="border-b border-slate-600 pb-2">
                <Text className="text-white font-extrabold">Category :</Text>
              </View>

              <View className="mt-2">
                <FlatList
                  data={categories}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  contentContainerClassName="gap-2 px-0.5 "
                  renderItem={({ item }) => {
                    const isSelected =
                      item.name.toLowerCase() ===
                      selectedCategoryId.toLowerCase();

                    return (
                      <TouchableOpacity
                        onPress={() => setSelectedCategoryId(item.name)}
                        activeOpacity={0.7}
                        className={`flex-row items-center gap-1 space-x-2 px-3.5 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? "bg-sky-600 border-sky-600 shadow-sm"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        {/* Icon Badge Wrapper */}
                        <View
                          className={`p-1 rounded-full items-center justify-center ${
                            isSelected ? "bg-white/20" : item.bg
                          }`}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={13}
                            color={isSelected ? "#ffffff" : undefined}
                            className={isSelected ? "" : item.text}
                          />
                        </View>

                        {/* Category Label String */}
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? "text-white" : "text-slate-700"
                          }`}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                  ListFooterComponent={
                    <TouchableOpacity
                      onPress={() => setIsCatModalVisible(true)}
                      activeOpacity={0.7}
                      className="flex-row items-center px-3 py-2 rounded-full border border-dashed border-slate-700 bg-slate-900/40 active:bg-slate-800"
                    >
                      <Ionicons
                        name="add"
                        size={14}
                        color="#10b981"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="text-xs font-bold text-slate-400">
                        Add
                      </Text>
                    </TouchableOpacity>
                  }
                  ListFooterComponentStyle={{ marginLeft: 4 }}
                />
              </View>
            </View>

            {/* This is the modal for add category */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={isCatModalVisible}
              onRequestClose={() => setIsCatModalVisible(false)}
            >
              <View className="flex-1 justify-end bg-black/60">
                <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 pb-8 shadow-2xl max-h-[80%]">
                  {/* Corner Controlled Top Header Container */}
                  <View className="flex-row justify-between items-center border-b border-slate-800 pb-3 mb-5">
                    <Text className="text-white text-base font-extrabold tracking-wide">
                      Create Custom Category
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsCatModalVisible(false)}
                      className="p-1 rounded-full bg-slate-800/60 active:bg-slate-800"
                    >
                      <Ionicons name="close" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>

                  {/* Input Element */}
                  <View className="gap-2 mb-4">
                    <Text className="text-slate-400 text-xs font-bold tracking-wider uppercase">
                      Category Title
                    </Text>
                    <TextInput
                      value={newCatName}
                      onChangeText={setNewCatName}
                      placeholder="e.g. Rent, Gym, Travel"
                      placeholderTextColor="#475569"
                      maxLength={16}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-sky-500"
                    />
                  </View>

                  {/* Icon Picker Array Matrix Grid */}
                  <Text className="text-slate-400 text-xs font-bold tracking-wider uppercase mb-2">
                    Select Icon Style
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row mb-6 py-1"
                    contentContainerClassName="gap-3"
                  >
                    {AVAILABLE_ICONS.map((iconName) => {
                      const isIconSelected = iconName === selectedIcon;
                      return (
                        <TouchableOpacity
                          key={iconName}
                          onPress={() => setSelectedIcon(iconName)}
                          className={`p-3 rounded-xl border ${
                            isIconSelected
                              ? "bg-sky-600 border-transparent shadow"
                              : "bg-slate-950 border-slate-800 active:bg-slate-900"
                          }`}
                        >
                          <Ionicons
                            name={iconName as any}
                            size={18}
                            color={isIconSelected ? "#ffffff" : "#94a3b8"}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Dialog Footer Operations Matrix */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        setNewCatName("");
                        setIsCatModalVisible(false);
                      }}
                      activeOpacity={0.7}
                      className="flex-1 items-center justify-center py-3.5 rounded-xl border border-slate-800 active:bg-slate-800/40"
                    >
                      <Text className="text-slate-400 text-sm font-bold">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleCategorySubmit}
                      activeOpacity={0.7}
                      className="flex-1 items-center justify-center py-3.5 rounded-xl bg-emerald-500 active:bg-emerald-600 shadow-md"
                    >
                      <Text className="text-slate-950 text-sm font-extrabold">
                        Create
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {/* This is for date-time */}
            <View className="gap-2 mb-6">
              <View className="border-b border-slate-700/40 pb-1.5 mb-1">
                <Text className="text-white font-extrabold text-sm">
                  Date & Time :
                </Text>
              </View>

              {/* 🚀 FIXED: Date/Time transformed into sleek interactive pill inputs */}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => showMode("date")}
                  activeOpacity={0.7}
                  className="flex-row flex-1 items-center px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50"
                >
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color="#a4b5cf"
                    className="mr-1.5"
                  />
                  <View className="flex-1">
                    <Text className="text-xs text-center font-semibold text-slate-200">
                      {date.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => showMode("time")}
                  activeOpacity={0.7}
                  className="flex-row flex-1 items-center px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50"
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="#a4b5cf"
                    className="mr-1.5"
                  />
                  <View className="flex-1">
                    <Text className="text-xs text-center font-semibold text-slate-200">
                      {date.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Native Picker Trigger Overlay */}
              {show && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode={mode}
                  is24Hour={false}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChange}
                />
              )}
            </View>

            {/* 🚀 FIXED: Form Control Buttons with strong visual hierarchy */}
            <View className="flex-row gap-3 pt-4  mt-2">
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                className="flex-1 py-3 rounded-xl border border-slate-700 bg-transparent active:bg-slate-800"
              >
                <Text className="text-center font-bold text-slate-400 text-sm">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveTransaction} // 🚀 Connected to validation framework engine
                activeOpacity={0.8}
                className="flex-2 py-3 rounded-xl bg-emerald-600 active:bg-emerald-700 shadow-md shadow-emerald-900/40"
              >
                <Text className="text-center font-bold text-white text-sm tracking-wide">
                  Save Transaction
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}
