import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import MercadoPage from "@/pages/MercadoPage";
import IAPage from "@/pages/IAPage";
import ExecucaoPage from "@/pages/ExecucaoPage";
import BacktestPage from "@/pages/BacktestPage";
import SistemaPage from "@/pages/SistemaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<MercadoPage />} />
            <Route path="/ia" element={<IAPage />} />
            <Route path="/execucao" element={<ExecucaoPage />} />
            <Route path="/backtest" element={<BacktestPage />} />
            <Route path="/sistema" element={<SistemaPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
