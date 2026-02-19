import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { FiAlertTriangle } from "react-icons/fi";

export default function NotFoundPage(){
    return (
        <div className="min-h-svh flex flex-col items-center justify-center">
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                    <FiAlertTriangle />
                    </EmptyMedia>
                    <EmptyTitle className="text-4xl">404</EmptyTitle>
                    <EmptyDescription>Page Not Found</EmptyDescription>
                </EmptyHeader>
            </Empty>
        </div>    
    )
};