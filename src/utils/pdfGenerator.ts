import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Device, CampusId } from '../types.ts';

interface PdfReportOptions {
  title?: string;
  selectedCampus?: CampusId | 'ALL';
  filterStatus?: 'all' | 'offline' | 'online';
  engineerName?: string;
}

export function generateDevicesPdfReport(devices: Device[], options: PdfReportOptions = {}) {
  const {
    title = 'IUB Master Network Equipment & Telemetry Report',
    selectedCampus = 'ALL',
    filterStatus = 'all',
    engineerName = 'Mr. Zeeshan Javed (AI Lead Engineer)',
  } = options;

  let filtered = [...devices];
  if (selectedCampus !== 'ALL') {
    filtered = filtered.filter((d) => d.campus === selectedCampus);
  }
  if (filterStatus === 'offline') {
    filtered = filtered.filter((d) => d.status === 'offline');
  } else if (filterStatus === 'online') {
    filtered = filtered.filter((d) => d.status === 'online');
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 72, 'F');

  // Green brand accent line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 72, pageWidth, 4, 'F');

  // University Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('THE ISLAMIA UNIVERSITY OF BAHAWALPUR', 40, 30);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Directorate of Information Technology (DIT) — Network Operations Center (NOC/SOC)', 40, 46);
  doc.text(`Lead Systems Architect: ${engineerName}`, 40, 60);

  // Right-side Date / Confidential badge
  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text('OFFICIAL TELEMETRY AUDIT', pageWidth - 40, 28, { align: 'right' });
  doc.setTextColor(226, 232, 240);
  doc.text(`Generated: ${dateStr} ${timeStr}`, pageWidth - 40, 44, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.text(`Scope: ${selectedCampus === 'ALL' ? 'All 6 Campuses' : selectedCampus + ' Campus'} | Filter: ${filterStatus.toUpperCase()}`, pageWidth - 40, 60, { align: 'right' });

  // 2. Summary KPI Box
  const totalCount = filtered.length;
  const onlineCount = filtered.filter((d) => d.status === 'online').length;
  const offlineCount = filtered.filter((d) => d.status === 'offline').length;
  const warningCount = filtered.filter((d) => d.status === 'warning').length;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(40, 88, pageWidth - 80, 42, 4, 4, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(40, 88, pageWidth - 80, 42, 4, 4, 'D');

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(`${title} (${totalCount} Total Items)`, 52, 112);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const kpiText = `Online: ${onlineCount}   |   Offline: ${offlineCount}   |   Warning: ${warningCount}   |   PRTG / Zabbix ICMP Monitored`;
  doc.setTextColor(71, 85, 105);
  doc.text(kpiText, pageWidth - 52, 112, { align: 'right' });

  // 3. Device Table
  const tableData = filtered.map((d, index) => [
    (index + 1).toString(),
    d.name,
    d.type.toUpperCase(),
    d.campus,
    `${d.building} (${d.roomNo || 'N/A'})`,
    d.ipAddress,
    d.macAddress || 'N/A',
    d.status.toUpperCase(),
    d.status === 'offline' ? (d.offTime ? new Date(d.offTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'OFFLINE') : (d.uptime || 'Online'),
    d.switchPort ? `${d.switchModel || 'Switch'} / ${d.switchPort}` : (d.rackId || 'Rack-01'),
  ]);

  autoTable(doc, {
    startY: 140,
    head: [[
      '#',
      'Device Name',
      'Type',
      'Campus',
      'Building & Room',
      'IP Address',
      'MAC Address',
      'Status',
      'Off Time / Uptime',
      'Switch Port / Rack',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 120, fontStyle: 'bold' },
      2: { cellWidth: 60 },
      3: { cellWidth: 45, halign: 'center' },
      4: { cellWidth: 110 },
      5: { cellWidth: 80, font: 'courier' },
      6: { cellWidth: 95, font: 'courier' },
      7: { cellWidth: 55, halign: 'center' },
      8: { cellWidth: 85 },
      9: { cellWidth: 95 },
    },
    didParseCell: (data) => {
      // Color status column
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw);
        if (val === 'ONLINE') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'OFFLINE') {
          data.cell.styles.textColor = [239, 68, 68]; // red
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'WARNING') {
          data.cell.styles.textColor = [245, 158, 11]; // amber
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    const footerText = `The Islamia University of Bahawalpur • Network Operations Center (NOC) Telemetry Report • Page ${i} of ${pageCount}`;
    doc.text(footerText, 40, doc.internal.pageSize.getHeight() - 16);
    doc.text('CONFIDENTIAL - FOR INTERNAL IUB DIT USE ONLY', doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 16, { align: 'right' });
  }

  // Save the PDF
  const filename = `IUB_Network_Equipment_Report_${selectedCampus}_${dateStr.replace(/ /g, '_')}.pdf`;
  doc.save(filename);
}
