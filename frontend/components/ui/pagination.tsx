"use client";

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onNext: () => void;
    onPrev: () => void;
    disabled?: boolean;
    total?: number;
};

export default function Pagination({ currentPage, totalPages, onNext, onPrev, disabled, total }: PaginationProps) {
    return (
        <div className="flex gap-2 items-center">
            <button onClick={onPrev} disabled={currentPage === 1 || disabled}>
                <ArrowLeftIcon className="h-5 w-5" />
            </button>

            <span>
                Page {currentPage} of {totalPages}
                {typeof total === "number" ? ` | ${total} total` : ""}
            </span>

            <button onClick={onNext} disabled={currentPage === totalPages || disabled}>
                <ArrowRightIcon className="h-5 w-5" />
            </button>
        </div>
    );
}
