import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, Clock, ArrowRight } from './Icons';
import { useFarm } from '../../context/FarmContext';

export default function TrialBanner() {
  const { subscription, remainingTrialDays, isTrial, isSubscriptionExpired, currentPlan } = useFarm();

  if (!subscription) return null;

  // Case 1: Subscription or Trial is Expired
  if (isSubscriptionExpired || subscription.status === 'expired') {
    return (
      <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-xs text-rose-900 font-semibold">
            <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong>14-Day Free Trial Expired:</strong> Your farm records remain safely stored and viewable. Activate a subscription to create new flocks and records.
            </span>
          </div>
          <Link
            to="/settings/subscription"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all shrink-0 self-start sm:self-auto"
          >
            <span>Activate Subscription</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: On 14-Day Free Trial
  if (isTrial || subscription.status === 'trial') {
    const isUrgent = remainingTrialDays <= 3;

    return (
      <div className={`${isUrgent ? 'bg-amber-50 border-b border-amber-200' : 'bg-blue-50 border-b border-blue-200'} px-4 py-2 sm:px-6 transition-all`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {isUrgent ? <Clock className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <span className={isUrgent ? 'text-amber-950' : 'text-blue-950'}>
              <strong className="font-extrabold">14-Day Free Trial:</strong> You have{' '}
              <span className={`px-1.5 py-0.5 rounded font-black ${isUrgent ? 'bg-amber-200/80 text-amber-950' : 'bg-blue-200/80 text-blue-950'}`}>
                {remainingTrialDays} {remainingTrialDays === 1 ? 'day' : 'days'} remaining
              </span>{' '}
              on your {currentPlan?.name || 'Basic'} plan.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <Link
              to="/settings/subscription"
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg shadow-2xs transition-all ${
                isUrgent
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>{isUrgent ? 'Activate Now' : 'Upgrade Plan'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
