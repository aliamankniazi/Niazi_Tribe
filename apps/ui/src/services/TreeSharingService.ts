import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Tree, TreeAccess, TreeInvite, AccessRole } from '../types';

export class TreeSharingService {
  private treesCollection = collection(db, 'trees');
  private treeAccessCollection = collection(db, 'treeAccess');
  private treeInvitesCollection = collection(db, 'treeInvites');

  async createTree(name: string, description: string, ownerId: string): Promise<string> {
    const tree: Omit<Tree, 'id'> = {
      name,
      description,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      metadata: {
        totalMembers: 0,
        generations: 0
      }
    };

    const treeRef = await addDoc(this.treesCollection, tree);
    
    // Create owner access
    await this.grantAccess(treeRef.id, ownerId, 'owner', ownerId);
    
    return treeRef.id;
  }

  async getTree(treeId: string): Promise<Tree | null> {
    const treeDoc = await getDoc(doc(this.treesCollection, treeId));
    return treeDoc.exists() ? { id: treeDoc.id, ...treeDoc.data() } as Tree : null;
  }

  async getUserTrees(userId: string): Promise<Tree[]> {
    const accessQuery = query(
      this.treeAccessCollection,
      where('userId', '==', userId)
    );
    
    const accessDocs = await getDocs(accessQuery);
    const treeIds = accessDocs.docs.map(doc => doc.data().treeId);
    
    const trees: Tree[] = [];
    for (const treeId of treeIds) {
      const tree = await this.getTree(treeId);
      if (tree) trees.push(tree);
    }
    
    return trees;
  }

  async getTreeAccess(treeId: string): Promise<TreeAccess[]> {
    const accessQuery = query(
      this.treeAccessCollection,
      where('treeId', '==', treeId)
    );
    
    const accessDocs = await getDocs(accessQuery);
    return accessDocs.docs.map(doc => ({ ...doc.data() }) as TreeAccess);
  }

  async getUserRole(treeId: string, userId: string): Promise<AccessRole | null> {
    const accessId = `${userId}_${treeId}`;
    const accessDoc = await getDoc(doc(this.treeAccessCollection, accessId));
    return accessDoc.exists() ? accessDoc.data().role as AccessRole : null;
  }

  async grantAccess(treeId: string, userId: string, role: AccessRole, grantedBy: string): Promise<void> {
    const accessId = `${userId}_${treeId}`;
    const access: TreeAccess = {
      treeId,
      userId,
      role,
      addedBy: grantedBy,
      addedAt: new Date()
    };

    await updateDoc(doc(this.treeAccessCollection, accessId), access);
  }

  async revokeAccess(treeId: string, userId: string): Promise<void> {
    const accessId = `${userId}_${treeId}`;
    await deleteDoc(doc(this.treeAccessCollection, accessId));
  }

  async createInvite(treeId: string, email: string, role: AccessRole, invitedBy: string): Promise<string> {
    const invite: Omit<TreeInvite, 'id'> = {
      treeId,
      email,
      role,
      invitedBy,
      invitedAt: new Date(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    };

    const inviteRef = await addDoc(this.treeInvitesCollection, invite);
    return inviteRef.id;
  }

  async getInvite(inviteId: string): Promise<TreeInvite | null> {
    const inviteDoc = await getDoc(doc(this.treeInvitesCollection, inviteId));
    return inviteDoc.exists() ? { id: inviteDoc.id, ...inviteDoc.data() } as TreeInvite : null;
  }

  async acceptInvite(inviteId: string, userId: string): Promise<void> {
    const invite = await this.getInvite(inviteId);
    if (!invite || invite.status !== 'pending' || invite.expiresAt < new Date()) {
      throw new Error('Invalid or expired invite');
    }

    // Grant access
    await this.grantAccess(invite.treeId, userId, invite.role, invite.invitedBy);

    // Update invite status
    await updateDoc(doc(this.treeInvitesCollection, inviteId), {
      status: 'accepted'
    });
  }

  async rejectInvite(inviteId: string): Promise<void> {
    await updateDoc(doc(this.treeInvitesCollection, inviteId), {
      status: 'rejected'
    });
  }

  async setTreePublic(treeId: string, isPublic: boolean): Promise<void> {
    await updateDoc(doc(this.treesCollection, treeId), {
      isPublic,
      updatedAt: serverTimestamp()
    });
  }
} 