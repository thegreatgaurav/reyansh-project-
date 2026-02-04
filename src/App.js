// app main code

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
} from "@mui/material";
import { AuthProvider } from "./context/AuthContext";
import { StepStatusProvider } from './context/StepStatusContext';

import Header from "./components/common/Header";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import ProfilePage from "./components/common/ProfilePage";
import SettingsPage from "./components/common/SettingsPage";
import HelpPage from "./components/common/HelpPage";
import SalesOrderIngestion from "./components/poIngestion/POIngestion";
import ClientManager from "./components/common/ClientManager";
import ProspectsClientManager from "./components/common/ProspectsClientManager";
import FlowManagement from "./components/flowManagement/FlowManagement";
import MyTasks from "./components/flowManagement/MyTasks";
import ComingSoon from "./components/common/ComingSoon";
import PrivateRoute from "./components/auth/PrivateRoute";
import SheetInitializer from "./components/admin/SheetInitializer";
import SheetsTroubleshooting from "./components/admin/SheetsTroubleshooting";
import DispatchForm from "./components/dispatch/DispatchForm";
import DispatchManagement from "./components/dispatch/DispatchManagement";
import DispatchTest from "./components/dispatch/DispatchTest";
import ProductManagement from "./components/product/ProductManagement";
import Inventory from "./components/Inventory/Inventory";
import InventoryMainNavigation from "./components/Inventory/InventoryMainNavigation";
import StockSheetNavigation from "./components/Inventory/StockSheetNavigation";
import MaterialInwardNavigation from "./components/Inventory/MaterialInwardNavigation";
import MaterialIssueNavigation from "./components/Inventory/MaterialIssueNavigation";
import FinishedGoodsNavigation from "./components/Inventory/FinishedGoodsNavigation";
import FGMaterialInwardNavigation from "./components/Inventory/FGMaterialInwardNavigation";
import FGMaterialOutwardNavigation from "./components/Inventory/FGMaterialOutwardNavigation";
import FGToBilling from "./components/Inventory/FGToBilling";
import BillOfMaterialsNavigation from "./components/Inventory/BillOfMaterialsNavigation";
import KittingSheetNavigation from "./components/Inventory/KittingSheetNavigation";
import PurchaseFlow from "./components/purchaseFlow/PurchaseFlow";
import PurchaseFlowLayout from "./components/purchaseFlow/PurchaseFlowLayout";
import config from './config/config';
import RaiseIndent from './components/purchaseFlow/RaiseIndent';
// Sales Flow imports
import SalesFlow from "./components/salesFlow/SalesFlow";
import SalesFlowLayout from "./components/salesFlow/SalesFlowLayout";
// Client Orders import
import EnhancedClientOrderTakingSheet from "./components/clientOrders/EnhancedClientOrderTakingSheet";
import SalesFlowSubheader from "./components/salesFlow/SalesFlowSubheader";
import LogAndQualifyLeads from "./components/salesFlow/LogAndQualifyLeads";
import InitialCallAndRequirementGathering from "./components/salesFlow/InitialCallAndRequirementGathering";
import EvaluateHighValueProspects from './components/salesFlow/EvaluateHighValueProspects';
import CheckFeasibility from './components/salesFlow/CheckFeasibility';
import StandardsAndCompliance from './components/salesFlow/StandardsAndCompliance';
import SendQuotation from './components/salesFlow/SendQuotation';
import ApprovePaymentTerms from './components/salesFlow/ApprovePaymentTerms';
import SampleSubmission from './components/salesFlow/SampleSubmission';
import GetApprovalForSample from './components/salesFlow/GetApprovalForSample';
import ApproveStrategicDeals from './components/salesFlow/ApproveStrategicDeals';
import SalesFlowDetails from './components/salesFlow/SalesFlowDetails';
import ApproveIndent from './components/purchaseFlow/steps/ApproveIndent';
import VendorManagement from './components/purchaseFlow/steps/VendorManagement';
import FloatRFQ from './components/purchaseFlow/steps/FloatRFQ';
import FollowupQuotations from './components/purchaseFlow/steps/FollowupQuotations';
import ComparativeStatement from './components/purchaseFlow/steps/ComparativeStatement';
import ApproveQuotation from './components/purchaseFlow/steps/ApproveQuotation';
import RequestSample from "./components/purchaseFlow/steps/RequestSample";
import InspectSample from "./components/purchaseFlow/steps/InspectSample";
import PlacePO from './components/purchaseFlow/steps/PlacePO';
import FollowupDelivery from './components/purchaseFlow/steps/FollowupDelivery';
import RecieveAndInspectMaterial from './components/purchaseFlow/steps/RecieveAndInspectMaterial';
import MaterialApproval from './components/purchaseFlow/steps/MaterialApproval';
import DecisionOnRejection from './components/purchaseFlow/steps/DecisionOnRejection';
import ReturnRejectedMaterial from './components/purchaseFlow/steps/ReturnRejectedMaterial';
import ResendMaterial from './components/purchaseFlow/steps/ResendMaterial';
import GenerateGRN from './components/purchaseFlow/steps/GenerateGRN';
import FinalGRN from './components/purchaseFlow/steps/FinalGRN';
import SubmitInvoice from './components/purchaseFlow/steps/SubmitInvoice';
import SchedulePayment from './components/purchaseFlow/steps/SchedulePayment';
import ReleasePayment from './components/purchaseFlow/steps/ReleasePayment';
import Costing from './components/Costing/Costing';
import SortVendors from './components/purchaseFlow/steps/SortVendors';
import CableProductionModule from './components/cable/CableProductionModule';
import MoldingProductionModule from './components/molding/MoldingProductionModule';
import MoldingMainNavigation from './components/molding/MoldingMainNavigation';
import MoldingDashboardNavigation from './components/molding/MoldingDashboardNavigation';
import PowerCordMasterNavigation from './components/molding/PowerCordMasterNavigation';
import ProductionPlanningNavigation from './components/molding/ProductionPlanningNavigation';
import ProductionManagementNavigation from './components/molding/ProductionManagementNavigation';
import ClientDashboard from './components/clientDashboard/ClientDashboard';
import AdvancedEmployeeDashboard from './components/employeeDashboard/AdvancedEmployeeDashboard';
import DocumentLibrary from './components/DocumentLibrary/DocumentLibrary';
import CRMManagement from './components/crm/CRMManagement';

// Create Zoho CRM-inspired theme - Professional, Bold, Sleek, Modern
const theme = createTheme({
  palette: {
    primary: {
      main: "#226DB4", // Zoho Primary Blue
      light: "#4A8BC8",
      dark: "#1A5A8F",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#089949", // Zoho Primary Green
      light: "#3AB368",
      dark: "#067A3A",
      contrastText: "#ffffff",
    },
    success: {
      main: "#1CB75E", // Zoho Success Green
      light: "#4CD47E",
      dark: "#15904A",
      lighter: "#E8F8F0",
    },
    error: {
      main: "#E42527", // Zoho Primary Red
      light: "#EB4D4F",
      dark: "#B81D1F",
      lighter: "#FEE8E8",
    },
    warning: {
      main: "#F9B21D", // Zoho Primary Yellow
      light: "#FBC44D",
      dark: "#C78F17",
      lighter: "#FFF8E8",
    },
    info: {
      main: "#03A9F5", // Zoho Info Blue
      light: "#35BBF7",
      dark: "#0287C4",
      lighter: "#E6F7FD",
    },
    background: {
      default: "#FAFAFA", // Zoho Light Grey
      paper: "#FFFFFF",
    },
    text: {
      primary: "#333333", // Zoho Dark Grey
      secondary: "#666666",
      disabled: "#999999",
    },
    grey: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#EEEEEE",
      300: "#E0E0E0",
      400: "#BDBDBD",
      500: "#9E9E9E",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2rem",
      lineHeight: 1.3,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "0.9375rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      fontSize: "0.9375rem",
      letterSpacing: "0.02em",
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 6, // Zoho-style rounded corners
  },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)", // 1
    "0 2px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)", // 2
    "0 3px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)", // 3
    "0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)", // 4
    "0 5px 10px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)", // 5
    "0 6px 12px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)", // 6
    "0 7px 14px rgba(0,0,0,0.12), 0 5px 10px rgba(0,0,0,0.08)", // 7
    "0 8px 16px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.08)", // 8
    "0 9px 18px rgba(0,0,0,0.14), 0 7px 14px rgba(0,0,0,0.1)", // 9
    "0 10px 20px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.1)", // 10
    "0 11px 22px rgba(0,0,0,0.14), 0 9px 18px rgba(0,0,0,0.1)", // 11
    "0 12px 24px rgba(0,0,0,0.16), 0 10px 20px rgba(0,0,0,0.12)", // 12
    "0 13px 26px rgba(0,0,0,0.16), 0 11px 22px rgba(0,0,0,0.12)", // 13
    "0 14px 28px rgba(0,0,0,0.16), 0 12px 24px rgba(0,0,0,0.12)", // 14
    "0 15px 30px rgba(0,0,0,0.18), 0 13px 26px rgba(0,0,0,0.14)", // 15
    "0 16px 32px rgba(0,0,0,0.18), 0 14px 28px rgba(0,0,0,0.14)", // 16
    "0 17px 34px rgba(0,0,0,0.18), 0 15px 30px rgba(0,0,0,0.14)", // 17
    "0 18px 36px rgba(0,0,0,0.2), 0 16px 32px rgba(0,0,0,0.16)", // 18
    "0 19px 38px rgba(0,0,0,0.2), 0 17px 34px rgba(0,0,0,0.16)", // 19
    "0 20px 40px rgba(0,0,0,0.2), 0 18px 36px rgba(0,0,0,0.16)", // 20
    "0 21px 42px rgba(0,0,0,0.22), 0 19px 38px rgba(0,0,0,0.18)", // 21
    "0 22px 44px rgba(0,0,0,0.22), 0 20px 40px rgba(0,0,0,0.18)", // 22
    "0 23px 46px rgba(0,0,0,0.22), 0 21px 42px rgba(0,0,0,0.18)", // 23
    "0 24px 48px rgba(0,0,0,0.24), 0 22px 44px rgba(0,0,0,0.2)", // 24
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9375rem",
          padding: "10px 24px",
          boxShadow: "none",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0 4px 12px rgba(34, 109, 180, 0.3)",
          },
        },
        outlined: {
          borderWidth: "1.5px",
          "&:hover": {
            borderWidth: "1.5px",
            backgroundColor: "rgba(34, 109, 180, 0.04)",
          },
        },
        text: {
          "&:hover": {
            backgroundColor: "rgba(34, 109, 180, 0.08)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: "1px solid rgba(0,0,0,0.06)",
        },
        elevation1: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        },
        elevation2: {
          boxShadow: "0 2px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        },
        elevation3: {
          boxShadow: "0 3px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          padding: "14px 16px",
          fontSize: "0.9375rem",
        },
        head: {
          fontWeight: 600,
          backgroundColor: "#FAFAFA",
          color: "#333333",
          fontSize: "0.875rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(34, 109, 180, 0.04)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(34, 109, 180, 0.08)",
            "&:hover": {
              backgroundColor: "rgba(34, 109, 180, 0.12)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          fontSize: "0.8125rem",
          height: "28px",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 6,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#226DB4",
              borderWidth: "1.5px",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#226DB4",
              borderWidth: "2px",
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.9375rem",
          minHeight: "48px",
          "&.Mui-selected": {
            fontWeight: 600,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: "rgba(34, 109, 180, 0.08)",
            transform: "scale(1.05)",
          },
        },
      },
    },
  },
});

// Private Route component
const PrivateRouteComponent = ({ children }) => {
  return <PrivateRoute>{children}</PrivateRoute>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <StepStatusProvider>
          <BrowserRouter>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Header />
              <Box component="main" sx={{ flex: 1, py: 2 }}>
                <Routes>
                  <Route path="/login" element={<Login />} />

                  <Route path="/dashboard" element={
                    <PrivateRouteComponent>
                      <Dashboard />
                    </PrivateRouteComponent>
                  } />
                  <Route path="/profile" element={
                    <PrivateRouteComponent>
                      <ProfilePage />
                    </PrivateRouteComponent>
                  } />
                  <Route path="/settings" element={
                    <PrivateRouteComponent>
                      <SettingsPage />
                    </PrivateRouteComponent>
                  } />
                  <Route path="/help" element={
                    <PrivateRouteComponent>
                      <HelpPage />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/clients" element={
                    <PrivateRouteComponent>
                      <ClientManager />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/prospects-clients" element={
                    <PrivateRouteComponent>
                      <ProspectsClientManager />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/client-dashboard" element={
                    <PrivateRouteComponent>
                      <ClientDashboard />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/products" element={
                    <PrivateRouteComponent>
                      <ProductManagement />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/client-orders" element={
                    <PrivateRouteComponent>
                      <EnhancedClientOrderTakingSheet />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/po-ingestion" element={
                    <PrivateRouteComponent>
                      <SalesOrderIngestion />
                    </PrivateRouteComponent>
                  } />
                  
                  <Route path="/flow-management" element={
                    <PrivateRouteComponent>
                      <FlowManagement />
                    </PrivateRouteComponent>
                  } />
                  
                  <Route path="/my-tasks" element={
                    <PrivateRouteComponent>
                      <ComingSoon 
                        title="My Tasks"
                        subtitle="Task Management Feature Coming Soon"
                        description="We're building a comprehensive task management system that will help you track and manage all your assigned tasks in one place. This feature will include task prioritization, status tracking, due dates, and much more!"
                        showBackButton={true}
                        showNotifyButton={false}
                      />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/cable-production" element={
                    <PrivateRouteComponent>
                      <Navigate to="/cable-production/dashboard" replace />
                    </PrivateRouteComponent>
                  } />
                  <Route path="/cable-production/dashboard" element={
                    <PrivateRouteComponent>
                      <CableProductionModule />
                    </PrivateRouteComponent>
                  } />
                  <Route path="/cable-production/production-planning" element={
                    <PrivateRouteComponent>
                      <CableProductionModule />
                    </PrivateRouteComponent>
                  } />
                  <Route path="/cable-production/machine-scheduling" element={
                    <PrivateRouteComponent>
                      <CableProductionModule />
                    </PrivateRouteComponent>
                  } />

                  {/* Old Molding Route (kept for backward compatibility) */}
                  <Route path="/molding-production" element={
                    <PrivateRouteComponent>
                      <MoldingProductionModule />
                    </PrivateRouteComponent>
                  } />

                  {/* New Molding Routes Structure */}
                  <Route path="/molding" element={
                    <PrivateRouteComponent>
                      <MoldingMainNavigation />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/molding/dashboard" element={
                    <PrivateRouteComponent>
                      <MoldingDashboardNavigation />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/molding/power-cord-master" element={
                    <PrivateRouteComponent>
                      <PowerCordMasterNavigation />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/molding/production-planning" element={
                    <PrivateRouteComponent>
                      <ProductionPlanningNavigation />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/molding/production-management" element={
                    <PrivateRouteComponent>
                      <ProductionManagementNavigation />
                    </PrivateRouteComponent>
                  } />

                  <Route path="/purchase-flow" element={
                    <PrivateRouteComponent>
                      <StepStatusProvider>
                        <PurchaseFlowLayout />
                      </StepStatusProvider>
                    </PrivateRouteComponent>
                  }>
                    <Route index element={<PurchaseFlow />} />
                    <Route path="raise-indent" element={<RaiseIndent />} />
                    <Route path="approve-indent" element={<ApproveIndent />} />
                    <Route path="float-rfq" element={<FloatRFQ />} />
                    <Route path="followup-quotations" element={<FollowupQuotations />} />
                    <Route path="comparative-statement" element={<ComparativeStatement />} />
                    <Route path="approve-quotation" element={<ApproveQuotation />} />
                    <Route path="request-sample" element={<RequestSample />} />
                    <Route path="inspect-sample" element={<InspectSample />} />
                    <Route path="place-po" element={<PlacePO />} />
                    <Route path="followup-delivery" element={<FollowupDelivery />} />
                    <Route path="recieve-inspect-material" element={<RecieveAndInspectMaterial />} />
                    <Route path="material-approval" element={<MaterialApproval />} />
                    <Route path="decision-on-rejection" element={<DecisionOnRejection />} />
                    <Route path="return-rejected-material" element={<ReturnRejectedMaterial />} />
                    <Route path="resend-material" element={<ResendMaterial />} />
                    <Route path="generate-grn" element={<GenerateGRN />} />
                    <Route path="final-grn" element={<FinalGRN />} />
                    <Route path="submit-invoice" element={<SubmitInvoice />} />
                    <Route path="schedule-payment" element={<SchedulePayment />} />
                    <Route path="release-payment" element={<ReleasePayment />} />
                    <Route path="sort-vendors" element={<SortVendors />} />
                  </Route>

                  <Route
                    path="/vendor-management"
                    element={
                      <PrivateRouteComponent>
                        <VendorManagement />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/inventory"
                    element={
                      <PrivateRouteComponent>
                        <InventoryMainNavigation />
                      </PrivateRouteComponent>
                    } />

                  {/* Separate Inventory Module Routes */}
                  <Route
                    path="/inventory/stock-sheet"
                    element={
                      <PrivateRouteComponent>
                        <StockSheetNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/stock-sheet/material-inward"
                    element={
                      <PrivateRouteComponent>
                        <MaterialInwardNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/stock-sheet/material-outward"
                    element={
                      <PrivateRouteComponent>
                        <MaterialIssueNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/stock-sheet/fg-material-inward"
                    element={
                      <PrivateRouteComponent>
                        <FGMaterialInwardNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/stock-sheet/fg-material-outward"
                    element={
                      <PrivateRouteComponent>
                        <FGMaterialOutwardNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/finished-goods"
                    element={
                      <PrivateRouteComponent>
                        <FinishedGoodsNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/bill-of-materials"
                    element={
                      <PrivateRouteComponent>
                        <BillOfMaterialsNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/bill-of-materials/kitting-sheet"
                    element={
                      <PrivateRouteComponent>
                        <KittingSheetNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/kitting-sheet"
                    element={
                      <PrivateRouteComponent>
                        <KittingSheetNavigation />
                      </PrivateRouteComponent>
                    } />

                  <Route
                    path="/inventory/fg-to-billing"
                    element={
                      <PrivateRouteComponent>
                        <FGToBilling />
                      </PrivateRouteComponent>
                    } />

                  {/* Legacy Inventory Route (for backward compatibility) */}
                  <Route
                    path="/inventory/legacy"
                    element={
                      <PrivateRouteComponent>
                        <Inventory />
                      </PrivateRouteComponent>
                    } />

                  {/* Sales Flow Routes */}
                  <Route path="/sales-flow" element={
                    <PrivateRouteComponent>
                      <SalesFlowLayout />
                    </PrivateRouteComponent>
                  }>
                    <Route index element={<SalesFlow />} />
                    <Route path="log-and-qualify-leads" element={<LogAndQualifyLeads />} />
                    <Route path="initial-call" element={<InitialCallAndRequirementGathering />} />
                    <Route path="evaluate-high-value-prospects" element={<EvaluateHighValueProspects />} />
                    <Route path="check-feasibility" element={<CheckFeasibility />} />
                    <Route path="confirm-standards" element={<StandardsAndCompliance />} />
                    <Route path="send-quotation" element={<SendQuotation />} />
                    <Route path="approve-payment-terms" element={<ApprovePaymentTerms />} />
                    <Route path="sample-submission" element={<SampleSubmission />} />
                    <Route path="get-approval-for-sample" element={<GetApprovalForSample />} />
                    <Route path="approve-strategic-deals" element={<ApproveStrategicDeals />} />
                    <Route path="order-booking" element={
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Order Booking</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    } />
                    <Route path="details" element={<SalesFlowDetails />} />
                    {/* Legacy routes for backward compatibility */}
                    <Route path="create-lead" element={<LogAndQualifyLeads />} />
                  </Route>
                  
                  <Route path="/sales-flow/plan-manufacturing" element={
                    <PrivateRouteComponent>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Plan & Execute Manufacturing</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </PrivateRouteComponent>
                  } />
                  
                  <Route path="/sales-flow/pack-dispatch" element={
                    <PrivateRouteComponent>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Pack & Dispatch Material</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </PrivateRouteComponent>
                  } />
                  
                  <Route path="/sales-flow/generate-invoice" element={
                    <PrivateRouteComponent>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Generate Invoice</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </PrivateRouteComponent>
                  } />
                  
                  <Route path="/sales-flow/update-client" element={
                    <PrivateRouteComponent>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Update Client on Dispatch</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </PrivateRouteComponent>
                  } />
                  
                  <Route path="/sales-flow/follow-up-feedback" element={
                    <PrivateRouteComponent>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Follow up for Feedback & Repeat Order</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </PrivateRouteComponent>
                  } />
                  
                  <Route path="/sales-flow/follow-up-payment" element={
                    <PrivateRouteComponent>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Follow-up on Balance Payment</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This step is under development.</Typography>
                      </Box>
                    </PrivateRouteComponent>
                  } />
                  
                  <Route path="/sales-flow/view-details" element={
                    <PrivateRouteComponent>
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="h4">Sales Flow Details</Typography>
                        <Typography variant="body1" sx={{ mt: 2 }}>This view is under development.</Typography>
                      </Box>
                    </PrivateRouteComponent>
                  } />

                  <Route
                    path="/setup-sheets"
                    element={
                      <PrivateRouteComponent>
                        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
                          <Typography variant="h4" sx={{ mb: 3 }}>
                            Google Sheets Setup
                          </Typography>
                          <SheetInitializer />
                        </Box>
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/troubleshoot-sheets"
                    element={
                      <PrivateRouteComponent>
                        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
                          <Typography variant="h4" sx={{ mb: 3 }}>
                            Troubleshoot Google Sheets
                          </Typography>
                          <SheetsTroubleshooting />
                        </Box>
                      </PrivateRouteComponent>
                    }
                  />

                  {config.useLocalStorage && (
                    <Route
                      path="/storage-debug"
                      element={
                        <PrivateRouteComponent>
                          <Box sx={{ maxWidth: 1200, mx: "auto", px: 2 }}>
                            <Typography variant="h4" sx={{ mb: 3 }}>
                              Document Storage Debugger
                            </Typography>
                          </Box>
                        </PrivateRouteComponent>
                      }
                    />
                  )}

                  <Route
                    path="/dispatch"
                    element={
                      <PrivateRouteComponent>
                        <DispatchForm />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/dispatch-management"
                    element={
                      <PrivateRouteComponent>
                        <DispatchManagement />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/dispatch-test"
                    element={
                      <PrivateRouteComponent>
                        <DispatchTest />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/costing"
                    element={
                      <PrivateRouteComponent>
                        <Costing />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/client-dashboard"
                    element={
                      <PrivateRouteComponent>
                        <ClientDashboard />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/employee-dashboard"
                    element={
                      <PrivateRouteComponent>
                        <AdvancedEmployeeDashboard />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/document-library"
                    element={
                      <PrivateRouteComponent>
                        <DocumentLibrary />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route
                    path="/crm"
                    element={
                      <PrivateRouteComponent>
                        <CRMManagement />
                      </PrivateRouteComponent>
                    }
                  />

                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Box>
              <Box
                component="footer"
                sx={{ py: 2, px: 3, mt: "auto", backgroundColor: "#f5f5f5" }}
              >
                <Typography variant="body2" color="text.secondary" align="center">
                  Reyansh Factory Operations Monitoring System &copy;{" "}
                  {new Date().getFullYear()}
                </Typography>
              </Box>
            </Box>
          </BrowserRouter>
        </StepStatusProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
