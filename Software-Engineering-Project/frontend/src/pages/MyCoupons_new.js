import React, { useState, useEffect } from 'react';
import { couponAPI, redemptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  TicketIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  GiftIcon,
  TruckIcon
} from '@heroicons/react/24/outline';

const MyCoupons = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchMyCoupons();
  }, []);

  const fetchMyCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponAPI.getAll();
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error('Fetch coupons error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch your coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemClick = (coupon) => {
    setSelectedCoupon(coupon);
    setRedeemAmount('');
    setShowRedeemModal(true);
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      toast.error('Please enter a valid transaction amount');
      return;
    }

    setRedeeming(true);
    try {
      const response = await redemptionAPI.redeem({
        coupon_code: selectedCoupon.code,
        transaction_amount: parseFloat(redeemAmount)
      });
      
      toast.success(
        `🎉 Coupon Redeemed! You saved $${response.data.discount_applied.toFixed(2)}`,
        { duration: 4000 }
      );
      
      setShowRedeemModal(false);
      setSelectedCoupon(null);
      setRedeemAmount('');
      fetchMyCoupons();
    } catch (error) {
      console.error('Redemption error:', error);
      toast.error(error.response?.data?.message || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  // Rest of file truncated for terminal command
