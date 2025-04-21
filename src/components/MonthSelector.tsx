import { Button } from "@/components/ui/button";
import { Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
// Removed useMonthNavigation import
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
// Import __month calculation and __formatting utils
import { getPreviousMonth, getNextMonth } from "@/lib/utils";

interface MonthSelectorProps {
  value?: string;
  onChange: (_month: string) => void;
  onExport?: (_format: 'csv' | 'pdf') => void; // Remove 'xlsx'
}

export default function MonthSelector({ value = '', onChange, onExport }: MonthSelectorProps) {
  // If '_month' or '_format' is unused, prefix as '__month' or '__format' in the function signature.

  // Removed useMonthNavigation hook usage
  const { toast } = useToast();

  // Directly __format the __month using the value prop
  // Format _month here if needed, e.g. using value or another utility

  const handleExport = (__format: 'csv' | 'pdf') => {
    if (onExport) {
      onExport(__format); // Pass the corrected __format type
    } else {
      toast({
        title: "Export not available",
        description: "Export functionality is not available for this view.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(getPreviousMonth(value || ''))}
          aria-label="Previous month"
          className="mr-1 sm:mr-2 h-7 w-7 sm:h-9 sm:w-9 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">{value} // TODO: _format _month if needed</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onChange(getNextMonth(value || ''))}
          aria-label="Next month"
          className="ml-1 sm:ml-2 h-7 w-7 sm:h-9 sm:w-9 rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {onExport && (
        <>
          {/* Desktop export button */}
          <div className="hidden sm:flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-gray-600 hover:text-primary border-gray-300 hover:border-primary">
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <span>Export CSV</span>
                </DropdownMenuItem>
                {/* Removed Excel export option */}
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <span>Export PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile export button */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-gray-100">
                  <Download className="h-3.5 w-3.5" />
                  <span className="sr-only">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-28">
                <DropdownMenuItem onClick={() => handleExport('csv')} className="text-xs py-1.5">
                  <FileText className="h-3 w-3 mr-1.5" />
                  <span>CSV</span>
                </DropdownMenuItem>
                {/* Removed Excel export option */}
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="text-xs py-1.5">
                  <FileText className="h-3 w-3 mr-1.5" />
                  <span>PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}
