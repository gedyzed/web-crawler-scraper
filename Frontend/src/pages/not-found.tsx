import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { FiAlertTriangle } from "react-icons/fi";

export default function NotFoundPage() {
    return (
        <div className="min-h-svh flex flex-col items-center justify-center bg-white dark:bg-[#0a0e14]">
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <FiAlertTriangle />
                    </EmptyMedia>
                    <EmptyTitle className="text-4xl">404</EmptyTitle>
                    <EmptyDescription>Page Not Found</EmptyDescription>
                </EmptyHeader>
                <EmptyContent />
            </Empty>
        </div>
    )
};
