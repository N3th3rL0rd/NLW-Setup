import { ScrollView, View, Text, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import dayjs from "dayjs";
import { api } from "../lib/axios";
import clsx from "clsx";

import { ProgressBar } from "../components/ProgressBar";
import { Checkbox } from "../components/Checkbox";
import { BackButton } from "../components/BackButton";
import { Loading } from "../components/Loading";
import { HabitsEmpty } from "../components/HabitsEmpty";
import { generateProgressPercentage } from "../utils/generate-progress-percentage";

interface Params {
	date: string;
}

interface DayInfoProps {
	completed: string[];
	possibleHabits: {
		id: string;
		title: string;
	}[];
}

export function Habit() {
	const [loading, setLoading] = useState(true);
	const [dayInfo, setDayInfo] = useState<DayInfoProps | null>(null);
	const [completedHabits, setCompletedHabits] = useState<string[]>([]);

	const route = useRoute();
	const { date } = route.params as Params;

	const parseDate = dayjs(date);
	const isDateInPast = parseDate.endOf("day").isBefore(new Date());
	const dayOfWeek = parseDate.format("dddd");
	const dayAndMonth = parseDate.format("DD/MM");

	const habitsProgress = dayInfo?.possibleHabits.length
		? generateProgressPercentage(
				dayInfo.possibleHabits.length,
				completedHabits.length
		  )
		: 0;

	async function fetchHabits() {
		try {
			setLoading(true);

			const response = await api.get("/day", { params: { date } });
			setDayInfo(response.data);
			setCompletedHabits(response.data.completedHabits);
		} catch (error) {
			console.log(error);
			Alert.alert("Ops 😟", "An error occurred while searching a habit 😣");
		} finally {
			setLoading(false);
		}
	}

	async function handleToggleHabit(habitId: string) {
		try {
			await api.patch(`/habits/${habitId}/toggle`);
			if (completedHabits.includes(habitId)) {
				setCompletedHabits((prevState) =>
					prevState.filter((habit) => habit !== habitId)
				);
			} else {
				setCompletedHabits((prevState) => [...prevState, habitId]);
			}
		} catch (error) {
			console.log(error);
			Alert.alert("Ops 😟", "An error occurred while updating a habit 😣");
		}
	}

	useEffect(() => {
		fetchHabits();
	}, []);

	if (loading) {
		return <Loading />;
	}

	function handleDeleteHabit(id: string) {
		Alert.alert("Delete habit", "Are you sure you want to delete this habit?", [
			{
				text: "Cancel",
				style: "cancel",
			},
			{
				text: "Delete",
				onPress: async () => {
					try {
						await api.delete(`/habits/${id}`);
						fetchHabits();
					} catch (error) {
						console.log(error);
						Alert.alert(
							"Ops 😟",
							"An error occurred while deleting a habit 😣"
						);
					}
				},
			},
		]);
	}

	return (
		<View className="flex-1 bg-background px-4 pt-16">
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				<BackButton />

				<Text className="mt-6 text-zinc-400 font-semibold text-base lowercase">
					{dayOfWeek}
				</Text>
				<Text className=" text-white font-extrabold text-3xl">
					{dayAndMonth}
				</Text>
				<ProgressBar progress={habitsProgress} />

				<View className={clsx("mt-6 px-1", { ["opacity-50"]: isDateInPast })}>
					{
					dayInfo?.possibleHabits ? (
						dayInfo.possibleHabits?.map((habit) => (
							<Checkbox
								key={habit.id}
								title={habit.title}
								checked={completedHabits.includes(habit.id)}
								onPress={() => handleToggleHabit(habit.id)}
								disabled={isDateInPast}
							/>
						))
					) : (
						<HabitsEmpty />
					)}
				</View>
				{isDateInPast && (
					<Text className="text-zinc-200 text-xl text-center top-5">
						You can't edit habits from the past 😥
					</Text>
				)}
			</ScrollView>
		</View>
	);
}
