// import { getAnalytics } from "firebase/analytics";

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
	addDoc,
	collection,
	CollectionReference,
	deleteDoc,
	doc,
	DocumentReference,
	DocumentSnapshot,
	getDoc,
	getDocs,
	getFirestore,
	onSnapshot,
	query,
	QueryConstraint,
	QueryDocumentSnapshot,
	QuerySnapshot,
	setDoc,
	snapshotEqual,
	updateDoc,
	writeBatch,
	type DocumentData,
	type UpdateData,
} from "firebase/firestore";

import { writable, type Writable } from "svelte/store";
import { getUserSummary } from "./models";
import { goto } from "$app/navigation";

// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
	apiKey: "AIzaSyAqZCp9R0Z-Y8d308vhAPpKW9rUTje_hHo",
	authDomain: "donequick-79f00.firebaseapp.com",
	projectId: "donequick-79f00",
	storageBucket: "donequick-79f00.appspot.com",
	messagingSenderId: "925660515289",
	appId: "1:925660515289:web:a30335f11b7bf8a456a7c8",
	measurementId: "G-448LETTGJX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

// export const analytics = getAnalytics(app);

export function newBatch() {
	return writeBatch(db);
}

export async function deleteCollection(path: string) {
	const batch = newBatch();
	await getDocs(collection(db, path)).then((res) =>
		res.docs.forEach((doc) => {
			batch.delete(doc.ref);
		})
	);
	await batch.commit();
}

export async function signIn() {
	await signInWithPopup(auth, new GoogleAuthProvider());
	if (!auth.currentUser) throw new Error("failed to sign in");

	goto("/");
	setDoc(doc(db, `users/${auth.currentUser.uid}`), getUserSummary(auth.currentUser));
}

export type WithRefAndId<T> = T & { ref: DocumentSnapshot["ref"]; id: DocumentSnapshot["id"] };

function formatDoc<T>(snapshot: DocumentSnapshot | QueryDocumentSnapshot) {
	return {
		ref: snapshot.ref,
		id: snapshot.id,
		...(snapshot.data() as T),
	} as WithRefAndId<T>;
}

function formatDocs<T>(snapshot: QuerySnapshot) {
	return snapshot.docs.map((doc) => formatDoc<T>(doc));
}

export async function getDocData<T extends DocumentData>(path: string): Promise<WithRefAndId<T>> {
	return await getDoc(doc(db, path)).then((snapshot) => formatDoc<T>(snapshot));
}

export async function getCollectionData<T extends DocumentData>(
	path: string,
	...queryConstraints: QueryConstraint[]
): Promise<WithRefAndId<T>[]> {
	return await getDocs(query(collection(db, path), ...queryConstraints)).then((snapshot) =>
		formatDocs<T>(snapshot)
	);
}

export type DocStore<T> = {
	set(val: T): void;
	update(val: UpdateData<T>): void;
	delete(): void;
	subscribe: Writable<WithRefAndId<T>>["subscribe"];
	ref: DocumentReference<DocumentData, DocumentData>;
};

export async function getDocStore<T extends DocumentData>(path: string): Promise<DocStore<T>> {
	const ref = doc(db, path);

	const curSnapshot = await getDoc(ref);
	const curVal = formatDoc<T>(curSnapshot);

	const { subscribe } = writable(curVal, (set) => {
		let prevSnapshot = curSnapshot;
		const unsubscribe = onSnapshot(ref, (snapshot) => {
			// avoid unnecessary sets, fixes jank with svelte animations
			if (!snapshotEqual(prevSnapshot, snapshot)) {
				set(formatDoc(snapshot));
				prevSnapshot = snapshot;
			}
		});
		return unsubscribe;
	});

	return {
		/**
		 * will be called when you do $storeName = val (after Svelte actually sets $storeName to val)
		 */
		set(val: T) {
			setDoc(ref, val);
		},
		update(val: UpdateData<T>) {
			updateDoc(ref, val);
		},
		delete() {
			deleteDoc(ref);
		},
		subscribe,
		ref,
	};
}

export type CollectionStore<T extends DocumentData> = {
	add(val: T): Promise<DocumentReference<DocumentData, DocumentData>>;
	subscribe: Writable<WithRefAndId<T>[]>["subscribe"];
	ref: CollectionReference<DocumentData, DocumentData>;
};

export async function getCollectionStore<T extends DocumentData>(
	path: string,
	...queryConstraints: QueryConstraint[]
): Promise<CollectionStore<T>> {
	const ref = collection(db, path);
	const queryRef = query(ref, ...queryConstraints);

	const curSnapshot = await getDocs(queryRef);
	const curVal = formatDocs<T>(curSnapshot);

	const { subscribe } = writable(curVal, (set) => {
		let prevSnapshot = curSnapshot;
		const unsubscribe = onSnapshot(queryRef, (snapshot) => {
			// avoid unnecessary sets, fixes jank with svelte animations
			if (!snapshotEqual(prevSnapshot, snapshot)) {
				set(formatDocs(snapshot));
				prevSnapshot = snapshot;
			}
		});
		return unsubscribe;
	});

	return {
		async add(val: T) {
			return await addDoc(ref, val);
		},
		subscribe,
		ref,
	};
}
