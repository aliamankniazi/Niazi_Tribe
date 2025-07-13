import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  School as EducationIcon,
  Work as CareerIcon,
  Favorite as MarriageIcon,
  HeartBroken as DivorceIcon,
  Home as ResidenceIcon,
  Flight as ImmigrationIcon,
  Military as MilitaryIcon,
  EmojiEvents as AchievementIcon,
  LocalHospital as MedicalIcon,
  Event as OtherIcon,
  ChildCare as BirthIcon,
  RemoveCircle as DeathIcon
} from '@mui/icons-material';
import { Box, Typography, IconButton, Card, CardContent, CardMedia } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { LifeEvent, EventType } from '@/types';

interface EventListProps {
  events: LifeEvent[];
  onEditEvent?: (event: LifeEvent) => void;
  showEditButton?: boolean;
}

const eventIcons: Record<EventType, React.ReactElement> = {
  birth: <BirthIcon />,
  death: <DeathIcon />,
  marriage: <MarriageIcon />,
  divorce: <DivorceIcon />,
  education: <EducationIcon />,
  career: <CareerIcon />,
  residence: <ResidenceIcon />,
  immigration: <ImmigrationIcon />,
  military: <MilitaryIcon />,
  achievement: <AchievementIcon />,
  medical: <MedicalIcon />,
  other: <OtherIcon />
};

const eventColors: Record<EventType, string> = {
  birth: '#4CAF50',
  death: '#9E9E9E',
  marriage: '#E91E63',
  divorce: '#F44336',
  education: '#2196F3',
  career: '#FF9800',
  residence: '#795548',
  immigration: '#3F51B5',
  military: '#607D8B',
  achievement: '#FFC107',
  medical: '#00BCD4',
  other: '#9C27B0'
};

export const EventList: React.FC<EventListProps> = ({
  events,
  onEditEvent,
  showEditButton = false
}) => {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Timeline position="right">
      {sortedEvents.map((event) => (
        <TimelineItem key={event.id}>
          <TimelineOppositeContent>
            <Typography variant="body2" color="textSecondary">
              {new Date(event.date).toLocaleDateString()}
              {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString()}`}
            </Typography>
            {event.location && (
              <Typography variant="caption" color="textSecondary" display="block">
                {event.location}
              </Typography>
            )}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot sx={{ bgcolor: eventColors[event.type] }}>
              {eventIcons[event.type]}
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <div>
                    <Typography variant="h6">
                      {event.title || event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {event.description}
                    </Typography>
                  </div>
                  {showEditButton && onEditEvent && (
                    <IconButton
                      size="small"
                      onClick={() => onEditEvent(event)}
                      sx={{ ml: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                {event.media && event.media.length > 0 && (
                  <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                    {event.media.map((item, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 100,
                          height: 100,
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 1
                        }}
                      >
                        {item.type === 'image' ? (
                          <CardMedia
                            component="img"
                            image={item.url}
                            alt={item.caption || ''}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'grey.100'
                            }}
                          >
                            Document
                          </Box>
                        )}
                        {item.caption && (
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              p: 0.5,
                              textAlign: 'center'
                            }}
                          >
                            {item.caption}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}; 