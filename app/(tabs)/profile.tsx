// import React from "react";
// import { Text, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// export default function profile() {
//   return (
//     <SafeAreaView
//       edges={["top"]}
//       style={{ flex: 1, backgroundColor: "#000000" }}
//     >
//       {/* <StatusBar style="light" /> */}
//       <View className="flex-1 items-center justify-center bg-[#000000] ">
//         <Text className="text-white">profile</Text>
//       </View>
//     </SafeAreaView>
//   );
// }

import { useFinanceStore } from "@/store/useFinanceStore";
import { Ionicons } from "@expo/vector-icons";

import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const transactions = useFinanceStore((state) => state.transactions);

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: "#000000" }}
    >
      <ScrollView className="p-4">
        {/* Profile Header */}
        <View className="items-center py-8">
          <View className="w-24 h-24 rounded-full bg-emerald-900 items-center justify-center border-2 border-emerald-500">
            <Ionicons name="person" size={40} color="#34d399" />
          </View>
          <Text className="text-white text-xl font-black mt-4">
            User Profile
          </Text>
          <Text className="text-slate-500 text-sm font-bold">
            Manage your finance data
          </Text>
        </View>

        {/* Action Sections */}
        <View className="gap-3">
          <SectionButton icon="shield-checkmark" title="Security & Privacy" />
          <SectionButton icon="notifications" title="Notifications" />

          {/* Data Export Trigger */}
          <TouchableOpacity className="flex-row items-center bg-slate-950 border border-slate-900 p-4 rounded-2xl gap-4">
            <Ionicons name="cloud-download" size={20} color="#10b981" />
            <Text className="text-white font-bold flex-1">
              Export Data Backup
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#475569" />
          </TouchableOpacity>

          <SectionButton icon="log-out" title="Sign Out" color="#f43f5e" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Simple helper component for list buttons
const SectionButton = ({ icon, title, color = "#ffffff" }: any) => (
  <TouchableOpacity className="flex-row items-center bg-slate-950 border border-slate-900 p-4 rounded-2xl gap-4">
    <Ionicons name={icon} size={20} color={color} />
    <Text style={{ color }} className="font-bold flex-1">
      {title}
    </Text>
    <Ionicons name="chevron-forward" size={16} color="#475569" />
  </TouchableOpacity>
);
