import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { DateRangeProvider } from "./context/DateRangeContext";
import { router } from "./router";

const queryClient = new QueryClient();

export default function App() {
  return (
    <DateRangeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </DateRangeProvider>
  );
}
