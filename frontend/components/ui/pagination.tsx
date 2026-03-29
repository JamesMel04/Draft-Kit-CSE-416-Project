/*
* Component to handle pagination layout and everything.
* Referenced from: https://nextjs.org/learn/dashboard-app/adding-search-and-pagination
* Note: PaginationMeta type might be overkill. Currently it has a limit, hasnext, hasprev, etc. But it may only need totalPages
*/
"use client"
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { PaginationMeta} from "@/_lib/types";
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

type UrlPaginationProps = {
    pagination: PaginationMeta;
    currentPage?: never;
    totalPages?: never;
    onNext?: never;
    onPrev?: never;
    disabled?: never;
    total?: never;
};

type ControlledPaginationProps = {
    pagination?: never;
    currentPage: number;
    totalPages: number;
    onNext: () => void;
    onPrev: () => void;
    disabled?: boolean;
    total?: number;
};

type PaginationProps = UrlPaginationProps | ControlledPaginationProps;

export default function Pagination(props: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isUrlMode = !!props.pagination;
    const currentPage = isUrlMode ? (Number(searchParams.get('page')) || 1) : props.currentPage;
    const totalPages = isUrlMode ? props.pagination.totalPages : props.totalPages;
    const total = isUrlMode ? props.pagination.total : props.total;
    const disabled = !isUrlMode && !!props.disabled;

    const buttonClass = "h-5 w-5";

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    }

    function handleNext() {
        if(currentPage < totalPages) {
            if (!isUrlMode) {
                props.onNext();
                return;
            }

            const url = createPageURL(currentPage+1);
            router.replace(url);
        }
    }

    function handlePrev() {
        if(currentPage > 1) {
            if (!isUrlMode) {
                props.onPrev();
                return;
            }

            const url = createPageURL(currentPage-1);
            router.replace(url);
        }
    }
    
    return (
        <div className="flex gap-2">
            <button onClick={handlePrev} disabled={currentPage === 1 || disabled}>
                <ArrowLeftIcon className={buttonClass} />
            </button>

            <span>
                Page {currentPage} of {totalPages}
                {typeof total === "number" ? ` | ${total} total` : ""}
            </span>

            <button onClick={handleNext} disabled={currentPage === totalPages || disabled}>
                <ArrowRightIcon className={buttonClass} />
            </button>
        </div>
    )

}