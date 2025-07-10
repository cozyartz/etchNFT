'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image, CheckCircle, AlertCircle, CreditCard, Wallet } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';

interface UploadedFile {
  id: string;
  name: string;
  description?: string;
  file_type: string;
  file_size: number;
  image_url: string;
  status: string;
  created_at: string;
}

interface ArtUploadProps {
  userEmail: string;
  onUploadSuccess?: (file: UploadedFile) => void;
  onProceedToOrder?: (file: UploadedFile) => void;
}

export default function ArtUpload({ userEmail, onUploadSuccess, onProceedToOrder }: ArtUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [mintStatus, setMintStatus] = useState<'none' | 'pending' | 'completed'>('none');
  const [mintData, setMintData] = useState<any>(null);
  const [showMintOptions, setShowMintOptions] = useState(false);
  const [mintAmount] = useState(25); // Default minting fee
  
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setError(null);
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size too large. Maximum 10MB allowed.');
      return;
    }

    setSelectedFile(file);
    setFormData(prev => ({ ...prev, name: file.name.split('.')[0] }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Check for existing mint status on component mount
  useEffect(() => {
    const checkMintStatus = async () => {
      try {
        const response = await fetch(`/api/mint-upload?userEmail=${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.mint) {
            setMintStatus('completed');
            setMintData(result.mint);
          }
        }
      } catch (error) {
        console.log('No existing mint found');
      }
    };
    
    checkMintStatus();
  }, [userEmail]);

  const handleMintPayment = async (paymentMethod: 'crypto' | 'web3') => {
    try {
      setError(null);
      
      if (paymentMethod === 'web3' && !isConnected) {
        setError('Please connect your wallet first');
        return;
      }

      const response = await fetch('/api/mint-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          amount: mintAmount,
          paymentMethod,
          walletAddress: address,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      if (paymentMethod === 'crypto') {
        // Redirect to Coinbase Commerce
        window.location.href = result.checkout_url;
      } else if (paymentMethod === 'web3') {
        // Handle Web3 signature
        const message = `EtchNFT Upload Minting\nUser: ${userEmail}\nAmount: $${mintAmount}\nMint ID: ${result.mint_id}\nTimestamp: ${new Date().toISOString()}`;
        
        const signature = await signMessageAsync({ message });
        
        setMintData({
          mint_id: result.mint_id,
          signature,
          message,
          tx_hash: `signature-${Date.now()}`,
        });
        setMintStatus('completed');
        setShowMintOptions(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.name.trim()) {
      setError('Please select a file and provide a name.');
      return;
    }

    if (mintStatus !== 'completed') {
      setError('Please complete minting payment first.');
      setShowMintOptions(true);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const submitData = new FormData();
      submitData.append('file', selectedFile);
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('userEmail', userEmail);
      
      // Add mint verification data
      if (mintData) {
        submitData.append('mintTxHash', mintData.tx_hash || '');
        submitData.append('mintSignature', mintData.signature || '');
        submitData.append('walletAddress', address || '');
      }

      const response = await fetch('/api/upload-art', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setShowMintOptions(true);
        }
        throw new Error(result.error || 'Upload failed');
      }

      setUploadedFile(result.data);
      onUploadSuccess?.(result.data);
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setFormData({ name: '', description: '' });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadedFile(null);
    setError(null);
    setFormData({ name: '', description: '' });
  };

  const handleProceedToOrder = () => {
    if (uploadedFile) {
      onProceedToOrder?.(uploadedFile);
    }
  };

  if (uploadedFile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-xl text-center"
      >
        <div className="text-green-400 mb-4">
          <CheckCircle size={64} className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Upload Successful!</h2>
        <p className="text-gray-300 mb-6">Your artwork "{uploadedFile.name}" has been uploaded successfully.</p>
        
        <div className="flex justify-center gap-4">
          <button
            onClick={handleProceedToOrder}
            className="bg-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-white transition"
          >
            Order This Artwork
          </button>
          <button
            onClick={handleReset}
            className="bg-zinc-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-zinc-600 transition"
          >
            Upload Another
          </button>
        </div>
      </motion.div>
    );
  }

  // Show minting options modal
  if (showMintOptions && mintStatus !== 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="glass p-8 rounded-xl max-w-md w-full mx-4"
        >
          <div className="text-center mb-6">
            <CreditCard className="text-accent mx-auto mb-4" size={48} />
            <h2 className="text-2xl font-bold text-white mb-2">Minting Required</h2>
            <p className="text-gray-300">
              To upload artwork, you need to mint upload privileges for ${mintAmount}.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => handleMintPayment('crypto')}
              className="w-full bg-accent text-black p-4 rounded-lg font-semibold hover:bg-white transition flex items-center justify-center gap-3"
            >
              <CreditCard size={20} />
              Pay with Crypto
            </button>
            
            {isConnected && (
              <button
                onClick={() => handleMintPayment('web3')}
                className="w-full bg-zinc-700 text-white p-4 rounded-lg font-semibold hover:bg-zinc-600 transition flex items-center justify-center gap-3"
              >
                <Wallet size={20} />
                Sign with Wallet
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowMintOptions(false)}
            className="w-full mt-4 text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mint Status */}
      {mintStatus === 'completed' && (
        <div className="glass p-4 rounded-lg border border-green-500 bg-green-500/10">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <p className="text-green-400 font-semibold">Upload Access Granted</p>
              <p className="text-sm text-gray-300">You can now upload artwork</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Area */}
      <div
        className={`glass p-8 rounded-xl border-2 border-dashed transition-all duration-300 ${
          dragActive 
            ? 'border-accent bg-accent/10' 
            : 'border-zinc-600 hover:border-zinc-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {preview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-xs max-h-64 rounded-lg object-cover"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                >
                  <X size={16} />
                </button>
              </div>
              {selectedFile && (
                <div className="text-sm text-gray-400">
                  <p className="font-semibold text-white">{selectedFile.name}</p>
                  <p>{formatFileSize(selectedFile.size)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-accent">
                <Upload size={64} className="mx-auto mb-4" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Drop your artwork here
                </h3>
                <p className="text-gray-400 mb-4">
                  Or click to browse files
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="bg-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-white transition cursor-pointer inline-block"
                >
                  Browse Files
                </label>
              </div>
              <div className="text-sm text-gray-500">
                <p>Supported formats: JPEG, PNG, GIF, WebP</p>
                <p>Maximum file size: 10MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      {selectedFile && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass p-6 rounded-xl space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Artwork Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:border-accent focus:outline-none"
              placeholder="Enter a name for your artwork"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:border-accent focus:outline-none"
              rows={3}
              placeholder="Describe your artwork..."
            />
          </div>

          <div className="space-y-4">
            {mintStatus !== 'completed' && (
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500 rounded-lg">
                <AlertCircle className="text-amber-400" size={20} />
                <div>
                  <p className="text-amber-400 font-semibold">Minting Required</p>
                  <p className="text-sm text-gray-300">Complete payment of ${mintAmount} to enable uploads</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMintOptions(true)}
                  className="ml-auto bg-amber-500 text-black px-4 py-2 rounded font-semibold hover:bg-amber-400 transition"
                >
                  Pay Now
                </button>
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading || mintStatus !== 'completed'}
                className="flex-1 bg-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Artwork'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="bg-zinc-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-zinc-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-4 rounded-lg border border-red-500 bg-red-500/10"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}