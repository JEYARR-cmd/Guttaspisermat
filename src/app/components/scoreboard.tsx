import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Trophy, Medal, Award, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ScoreboardItem {
  name: string;
  score: number;
  rank: number;
}

interface ScoreboardProps {
  title: string;
  description: string;
  items: ScoreboardItem[];
  initialLimit?: number;
  expandable?: boolean;
  showBottomEmojis?: boolean;
}

export function Scoreboard({ title, description, items, initialLimit, expandable = false, showBottomEmojis = false }: ScoreboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayItems = expandable && !isExpanded && initialLimit 
    ? items.slice(0, initialLimit) 
    : items;
  
  const hasMore = expandable && initialLimit && items.length > initialLimit;

  const getIcon = (rank: number) => {
    const isBottomThree = showBottomEmojis && rank > items.length - 3;
    
    if (isBottomThree) {
      return <span className="text-xl">🤮</span>;
    }
    
    switch (rank) {
      case 1:
        return <Trophy className="size-5 text-yellow-500" />;
      case 2:
        return <Medal className="size-5 text-gray-400" />;
      case 3:
        return <Award className="size-5 text-amber-700" />;
      default:
        return <div className="size-5 flex items-center justify-center text-sm font-semibold text-muted-foreground">{rank}</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="bg-slate-950/20 border border-slate-800/50 px-4 py-3 rounded">
            <p className="text-sm text-slate-300">Ingen rangeringer er lagt til enda</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {displayItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getIcon(item.rank)}
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.score.toFixed(1)}</span>
                </div>
              ))}
            </div>
            
            {hasMore && (
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-4 mr-2" />
                    Vis mindre
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4 mr-2" />
                    Vis alle ({items.length})
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}