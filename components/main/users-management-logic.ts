"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserProfile, UserStatus } from "@/components/main/users-management-types";
import usersData from "@/data/users.json";
import { fetchUsers, updateUserAction } from "@/lib/users-client";

export type SummaryCard = {
  label: string;
  value: string;
  trend: string;
  tone: string;
  icon: "users" | "user" | "blocked" | "new";
  iconWrap: string;
};

type UsersApiResponse = {
  summaryCards: SummaryCard[];
  users: UserProfile[];
};

const usersApiResponse = usersData as UsersApiResponse;

const pageSize = 10;

export function useUsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>(usersApiResponse.users);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [showAllBookings, setShowAllBookings] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.id.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, users]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 4) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: Array<number | "ellipsis"> = [1];

    if (page <= 3) {
      items.push(2, 3, "ellipsis", totalPages);
      return items;
    }

    if (page >= totalPages - 2) {
      items.push("ellipsis", totalPages - 2, totalPages - 1, totalPages);
      return items;
    }

    items.push("ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
    return items;
  }, [page, totalPages]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  const summaryCards = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === "ACTIVE").length;
    const blockedUsers = users.filter((user) => user.status === "BLOCKED").length;
    return usersApiResponse.summaryCards.map((card) => {
      if (card.label === "TOTAL USERS") {
        return { ...card, value: totalUsers.toLocaleString() };
      }
      if (card.label === "ACTIVE USERS") {
        return { ...card, value: activeUsers.toLocaleString() };
      }
      if (card.label === "BLOCKED USERS") {
        return { ...card, value: blockedUsers.toLocaleString() };
      }
      return card;
    });
  }, [users]);

  useEffect(() => {
    setShowAllBookings(false);
  }, [selectedUserId]);

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      try {
        const data = await fetchUsers(controller.signal);
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") {
          return;
        }
      }
    };
    loadUsers();
    return () => controller.abort();
  }, []);

  const persistUserAction = async (id: string, action: "toggleStatus" | "resetPassword") => {
    const updated = await updateUserAction(id, action);
    setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
  };

  return {
    users,
    filteredUsers,
    pagedUsers,
    summaryCards,
    selectedUser,
    query,
    statusFilter,
    filtersOpen,
    page,
    totalPages,
    paginationItems,
    pageSize,
    showAllBookings,
    setSelectedUserId,
    setQuery,
    setStatusFilter,
    setFiltersOpen,
    setPage,
    setShowAllBookings,
    persistUserAction
  };
}
