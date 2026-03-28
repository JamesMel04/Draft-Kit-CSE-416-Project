/*
* Component to handle pagination layout and everything.
* Referenced from: https://nextjs.org/learn/dashboard-app/adding-search-and-pagination
* Note: PaginationMeta type might be overkill. Currently it has a limit, hasnext, hasprev, etc. But it may only need totalPages
*/
"use client"
export const dynamic="force dynamic"
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PaginationMeta} from "@/_lib/types";
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import {Suspense} from "react";
export default function Pagination({pagination} : {pagination : PaginationMeta}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentPage = Number(searchParams.get('page')) || 1;
    const totalPages = pagination.totalPages;

    const buttonClass = "h-5 w-5";

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    }

    function handleNext() {
        if(currentPage < totalPages) {
            const url = createPageURL(currentPage+1);
            router.replace(url);
        }
    }

    function handlePrev() {
        if(currentPage > 1) {
            const url = createPageURL(currentPage-1);
            router.replace(url);
        }
    }
    
    return (
        <Suspense fallback={<>...</>}>
        <div className="flex gap-2">
            <button onClick={handlePrev} disabled={currentPage === 1}>
                <ArrowLeftIcon className={buttonClass} />
            </button>

            <span>
                Page {currentPage} of {totalPages}
            </span>

            <button onClick={handleNext} disabled={currentPage === totalPages}>
                <ArrowRightIcon className={buttonClass} />
            </button>
        </div>
        </Suspense>
    )

}