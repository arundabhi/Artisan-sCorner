import mongoose from 'mongoose';

let isTransactionSupported = null;

/**
 * Checks if the connected MongoDB instance supports transactions.
 * (Replica Set or Mongos/Sharded Cluster).
 * Returns cached value if already checked.
 */
export const checkTransactionSupport = async () => {
  if (isTransactionSupported !== null) {
    return isTransactionSupported;
  }
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return false; // Not connected yet
    }
    const admin = mongoose.connection.db.admin();
    const helloResult = await admin.command({ hello: 1 });
    const isReplicaSet = !!helloResult.setName;
    const isMongos = helloResult.msg === 'isdbgrid';
    isTransactionSupported = isReplicaSet || isMongos;
  } catch (error) {
    console.error("Failed to check MongoDB transaction support, defaulting to false:", error);
    isTransactionSupported = false;
  }
  return isTransactionSupported;
};

/**
 * Starts a mongoose transaction session if supported, otherwise returns null.
 */
export const startTransactionHelper = async () => {
  const supports = await checkTransactionSupport();
  if (!supports) {
    return null;
  }
  
  try {
    const session = await mongoose.startSession();
    return session;
  } catch (error) {
    console.error("Failed to start transaction session:", error);
    return null;
  }
};
