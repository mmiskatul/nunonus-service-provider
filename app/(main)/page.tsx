import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import { BookingTrendsChart } from "@/components/BookingTrendsChart";
import { UpcomingBookingsTable } from "@/components/UpcomingBookingsTable";
import { CalendarPreview } from "@/components/CalendarPreview";
import { RecentReviews } from "@/components/RecentReviews";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="space-y-10 p-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
          <StatsCard title="Total Bookings (MO)" value="428" trend={{ value: "12% vs last month", type: "up" }} />
          <StatsCard title="Today's Bookings" value="24" trend={{ value: "3 pending approval", type: "alert" }} />
          <StatsCard title="Monthly Revenue" value="$18,450" trend={{ value: "8.4% increase", type: "up" }} />
          <StatsCard title="Occupancy Rate" value="88%" trend={{ value: "Optimized", type: "success" }} />
          <StatsCard title="Average Rating" value="4.8" trend={{ value: "From 1,204 reviews", type: "rating" }} />
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BookingTrendsChart />
          </div>
          <div>
            <CalendarPreview />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UpcomingBookingsTable />
          </div>
          <div>
            <RecentReviews />
          </div>
        </div>
      </div>
    </div>
  );
}
