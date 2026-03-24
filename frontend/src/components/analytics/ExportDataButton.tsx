import { useState } from 'react';
import { Button, Menu, MenuItem, CircularProgress } from '@mui/material';
import { Download, KeyboardArrowDown } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { analyticsApi, TimeRange } from '../../api/analytics';

interface ExportDataButtonProps {
  type: 'portfolio' | 'market';
  marketId?: string;
}

export function ExportDataButton({ type, marketId }: ExportDataButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (timeRange?: TimeRange) => {
    setExporting(true);
    handleClose();

    try {
      let blob: Blob;
      let filename: string;

      if (type === 'portfolio' && timeRange) {
        blob = await analyticsApi.exportPortfolioData(timeRange);
        filename = `portfolio-${timeRange}-${Date.now()}.csv`;
      } else if (type === 'market' && marketId) {
        blob = await analyticsApi.exportMarketData(marketId);
        filename = `market-${marketId}-${Date.now()}.csv`;
      } else {
        throw new Error('Invalid export configuration');
      }

      downloadBlob(blob, filename);
      toast.success('Data exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={exporting ? <CircularProgress size={16} /> : <Download />}
        endIcon={type === 'portfolio' ? <KeyboardArrowDown /> : undefined}
        onClick={type === 'portfolio' ? handleClick : () => handleExport()}
        disabled={exporting}
      >
        {exporting ? 'Exporting...' : 'Export Data'}
      </Button>

      {type === 'portfolio' && (
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => handleExport('24h')}>Last 24 Hours</MenuItem>
          <MenuItem onClick={() => handleExport('7d')}>Last 7 Days</MenuItem>
          <MenuItem onClick={() => handleExport('30d')}>Last 30 Days</MenuItem>
          <MenuItem onClick={() => handleExport('all')}>All Time</MenuItem>
        </Menu>
      )}
    </>
  );
}
