'use client';
import { useEffect } from 'react';
import Head from 'next/head';
import OfflineIndicator from '../../components/OfflineIndicator';
import DashboardPWAPrompt from '../../components/DashboardPWAPrompt';
import OfflineSyncManager from '../../lib/offlineSyncManager';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize offline sync manager
    OfflineSyncManager.initialize();
  }, []);

  return (
    <>
      <Head>
        <title>KYC Admin Dashboard</title>
        <meta name="description" content="Admin dashboard for KYC application management and review" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      {children}
      <OfflineIndicator />
      <DashboardPWAPrompt />
    </>
  );
}
