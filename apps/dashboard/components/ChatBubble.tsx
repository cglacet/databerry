import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ThreePRoundedIcon from '@mui/icons-material/ThreePRounded';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Card from '@mui/joy/Card';
import Chip from '@mui/joy/Chip';
import CircularProgress from '@mui/joy/CircularProgress';
import colors from '@mui/joy/colors';
import Divider from '@mui/joy/Divider';
import IconButton from '@mui/joy/IconButton';
import Input from '@mui/joy/Input';
import Stack from '@mui/joy/Stack';
import { extendTheme, useColorScheme } from '@mui/joy/styles';
import Typography from '@mui/joy/Typography';
import React, { useEffect, useMemo, useRef } from 'react';
import { Transition } from 'react-transition-group';

import ChatBox from '@app/components/ChatBox';
import useChat from '@app/hooks/useChat';
import useStateReducer from '@app/hooks/useStateReducer';

import pickColorBasedOnBgColor from '@chaindesk/lib/pick-color-based-on-bgcolor';
import { AgentInterfaceConfig } from '@chaindesk/lib/types/models';
import type { Agent } from '@chaindesk/prisma';

export const theme = extendTheme({
  cssVarPrefix: 'databerry-chat-bubble',
  colorSchemes: {
    dark: {
      palette: {
        primary: colors.grey,
      },
    },
    light: {
      palette: {
        primary: colors.grey,
      },
    },
  },
});

const defaultChatBubbleConfig: AgentInterfaceConfig = {
  // displayName: 'Agent Smith',
  theme: 'light',
  primaryColor: '#000000',
  // initialMessage: 'Hi, how can I help you?',
  // position: 'right',
  // messageTemplates: ["What's the pricing?"],
};

const API_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL;

function App(props: { agentId: string; initConfig?: AgentInterfaceConfig }) {
  // const { setMode } = useColorScheme();
  const initMessageRef = useRef(null);
  const chatBoxRef = useRef(null);

  const [state, setState] = useStateReducer({
    isOpen: false,
    agent: undefined as Agent | undefined,
    config: props.initConfig || defaultChatBubbleConfig,
    hasOpenOnce: false,
    showInitialMessage: false,
    showHelp: false,
    showCaptureForm: false,
    isCaptureLoading: false,
    visitorEmail: '',
  });

  const {
    history,
    handleChatSubmit,
    conversationId,
    visitorId,
    isLoadingConversation,
    hasMoreMessages,
    handleLoadMoreMessages,
    handleEvalAnswer,
    handleAbort,
  } = useChat({
    endpoint: `${API_URL}/api/agents/${props.agentId}/query`,
    channel: 'website',
    // channel: ConversationChannel.website // not working with bundler parcel,
    agentId: props?.agentId,
    localStorageConversationIdKey: 'chatBubbleConversationId',
  });

  const textColor = useMemo(() => {
    return pickColorBasedOnBgColor(
      state.config.primaryColor || '#ffffff',
      '#ffffff',
      '#000000'
    );
  }, [state.config.primaryColor]);

  // TODO: find why onSuccess is not working
  // useSWR<Agent>(`${API_URL}/api/agents/${agentId}`, fetcher, {
  //   onSuccess: (data) => {
  //     const agentConfig = data?.interfaceConfig as AgentInterfaceConfig;

  //     setAgent(data);
  //     setConfig({
  //       ...defaultChatBubbleConfig,
  //       ...agentConfig,
  //     });
  //   },
  //   onError: (err) => {
  //     console.error(err);
  //   },
  // });

  const handleFetchAgent = async () => {
    try {
      const res = await fetch(`${API_URL}/api/agents/${props.agentId}`);
      const data = (await res.json()) as Agent;

      const agentConfig = data?.interfaceConfig as AgentInterfaceConfig;

      setState({
        agent: data,
        config: {
          ...defaultChatBubbleConfig,
          ...agentConfig,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
    }
  };

  useEffect(() => {
    if (props.agentId) {
      handleFetchAgent();
    }
  }, [props.agentId]);

  useEffect(() => {
    if (
      state.config?.initialMessage &&
      !state.config?.isInitMessagePopupDisabled
    ) {
      setTimeout(() => {
        setState({
          showInitialMessage: true,
        });
      }, 5000);
    }
  }, [state?.config?.initialMessage]);

  useEffect(() => {
    if (props.initConfig) {
      setState({
        config: props.initConfig,
      });
    }
  }, [props.initConfig]);

  useEffect(() => {
    if (localStorage) {
      try {
        const visitorEmail = localStorage.getItem('visitorEmail');

        if (visitorEmail) {
          setState({
            visitorEmail,
          });
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      setState({
        showHelp: true,
      });
    }
  }, [conversationId]);

  // useEffect(() => {
  //   if (config?.theme) {
  //     setMode(config.theme!);
  //   }
  // }, [config.theme]);

  const transitionStyles = {
    entering: { opacity: 0 },
    entered: { opacity: 1 },
    exiting: { opacity: 0 },
    exited: { opacity: 0 },
  };

  const bubbleIcon = useMemo(() => {
    if (state.agent?.iconUrl) {
      return (
        <Avatar
          src={state.agent?.iconUrl}
          sx={{ width: '100%', height: '100%' }}
        />
      );
      // return <img src={state.agent?.iconUrl} width="100%" height="100%" />;
    } else {
      return <AutoAwesomeIcon />;
    }
  }, [state.agent?.iconUrl]);

  const Capture = useMemo(() => {
    let Component = null;

    if (state.showHelp || state.visitorEmail) {
      Component = (
        <Stack
          sx={{
            mb: -1,
            position: 'absolute',
            bottom: 0,
            width: '100%',
          }}
        >
          {state.visitorEmail && (
            <Chip
              size="sm"
              color="success"
              variant="soft"
              sx={{ mr: 'auto' }}
              endDecorator={<CheckRoundedIcon />}
            >
              help requested
            </Chip>
          )}

          {!state.visitorEmail && !state.showCaptureForm && (
            <Button
              size="sm"
              variant="plain"
              color="neutral"
              startDecorator={<ThreePRoundedIcon />}
              sx={{ mr: 'auto' }}
              onClick={() => setState({ showCaptureForm: true })}
            >
              Help
            </Button>
          )}

          {!state.visitorEmail && state.showCaptureForm && (
            <form
              onSubmit={async (e) => {
                console.log(e.target);
                e.preventDefault();
                e.stopPropagation();

                const form = e.target as HTMLFormElement;

                const email = form.email.value;

                if (email) {
                  setState({ isCaptureLoading: true });

                  await fetch(
                    `${API_URL}/api/agents/${props.agentId}/capture`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        visitorEmail: email,
                        conversationId,
                        visitorId,
                      }),
                    }
                  );

                  setState({
                    showHelp: false,
                    isCaptureLoading: false,
                    visitorEmail: email,
                  });

                  try {
                    localStorage.setItem('visitorEmail', email);
                  } catch {}
                }
              }}
            >
              <Stack direction="row" gap={0.5} sx={{ width: '100%' }}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => {
                    setState({
                      showCaptureForm: false,
                    });
                  }}
                >
                  <ArrowBackRoundedIcon />
                </IconButton>

                <Input
                  sx={{ width: '100%' }}
                  size="sm"
                  name="email"
                  type="email"
                  placeholder="Leave your email to get contacted by the team"
                  required
                  // startDecorator={<AlternateEmailRoundedIcon />}
                  disabled={state.isCaptureLoading}
                  endDecorator={
                    <IconButton
                      color="neutral"
                      type="submit"
                      disabled={state.isCaptureLoading}
                    >
                      {state.isCaptureLoading ? (
                        <CircularProgress size="sm" variant="soft" />
                      ) : (
                        <CheckRoundedIcon />
                      )}
                    </IconButton>
                  }
                ></Input>
              </Stack>
            </form>
          )}
        </Stack>
      );
    }

    return Component;
  }, [
    state.showHelp,
    props.agentId,
    state.isCaptureLoading,
    state.showCaptureForm,
    setState,
    state.visitorEmail,
    visitorId,
  ]);

  if (!state.agent) {
    return null;
  }

  return (
    <>
      <Transition
        nodeRef={initMessageRef}
        in={state.showInitialMessage && !state.hasOpenOnce}
        timeout={0}
        mountOnEnter
        unmountOnExit
      >
        {(s) => (
          <Stack
            ref={initMessageRef}
            sx={{
              position: 'fixed',
              bottom: 100,
              maxWidth: 'calc(100% - 75px)',

              transition: `opacity 300ms ease-in-out`,
              opacity: 0,
              zIndex: 9999999998,
              ...(transitionStyles as any)[s],

              ...(state.config.position === 'left'
                ? {
                    left: '20px',
                  }
                : {}),
              ...(state.config.position === 'right'
                ? {
                    right: '20px',
                  }
                : {}),
            }}
          >
            <Card
              sx={{
                maxWidth: 1000,
                display: 'flex',
              }}
              variant="outlined"
            >
              <Typography>{state.config?.initialMessage}</Typography>
            </Card>
          </Stack>
        )}
      </Transition>

      <Box
        sx={{
          // bgcolor: 'red',
          overflow: 'visible',
          position: 'fixed',
          height: '60px',
          bottom: '20px',
          zIndex: 9999999999,

          ...(state.config.position === 'left'
            ? {
                left: '20px',
              }
            : {}),
          ...(state.config.position === 'right'
            ? {
                right: '20px',
              }
            : {}),
        }}
      >
        <Transition
          nodeRef={chatBoxRef}
          in={state.isOpen}
          timeout={0}
          mountOnEnter
          unmountOnExit
        >
          {(s) => (
            <Card
              ref={chatBoxRef}
              variant="outlined"
              sx={(theme) => ({
                zIndex: 9999,
                position: 'absolute',
                bottom: '80px',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                // boxShadow: 'md',

                transition: `opacity 150ms ease-in-out`,
                opacity: 0,
                ...(transitionStyles as any)[s],

                ...(state.config.position === 'right'
                  ? {
                      transform: `translateX(${-500 + 50}px)`,
                    }
                  : {}),

                [theme.breakpoints.up('sm')]: {
                  width: '500px',
                },
                [theme.breakpoints.only('xs')]: {
                  width: '100vw',
                  height: '100dvh',
                  maxWidth: '100vw',
                  position: 'fixed',

                  left: 0,
                  top: 0,
                  transform: `translateX(0px)`,

                  // ...(state.config.position === 'left'
                  //   ? {
                  //       left: '-20px',
                  //     }
                  //   : {}),
                  // ...(state.config.position === 'right'
                  //   ? {
                  //       transform: `translateX(0px)`,
                  //       right: '-20px',
                  //     }
                  //   : {}),
                },
              })}
            >
              <Box sx={{ width: '100%', mt: -2, py: 1 }}>
                <Stack direction="row" alignItems={'center'}>
                  {state.config?.displayName && (
                    <Typography>{state.config?.displayName}</Typography>
                  )}

                  <IconButton
                    variant="plain"
                    sx={{ ml: 'auto' }}
                    size="sm"
                    onClick={() => setState({ isOpen: false })}
                  >
                    <CloseRoundedIcon />
                  </IconButton>
                </Stack>
              </Box>
              <Divider />
              <Box
                sx={(theme) => ({
                  // flex: 1,
                  // display: 'flex',
                  width: '100%',
                  position: 'relative',

                  height: 'calc(100vh - 200px)',

                  [theme.breakpoints.up('sm')]: {
                    maxHeight: '680px',
                  },
                  [theme.breakpoints.only('xs')]: {
                    height: '100%',
                    maxWidth: '100vw',
                  },

                  '& .message-agent': {},
                  '& .message-human': {
                    backgroundColor: state.config.primaryColor,
                  },
                  '& .message-human *': {
                    color: textColor,
                  },
                })}
              >
                <ChatBox
                  messages={history}
                  onSubmit={handleChatSubmit}
                  messageTemplates={state.config.messageTemplates}
                  initialMessage={state.config.initialMessage}
                  renderBottom={Capture}
                  agentIconUrl={state.agent?.iconUrl!}
                  isLoadingConversation={isLoadingConversation}
                  hasMoreMessages={hasMoreMessages}
                  handleLoadMoreMessages={handleLoadMoreMessages}
                  handleEvalAnswer={handleEvalAnswer}
                  handleAbort={handleAbort}
                  hideInternalSources
                />
              </Box>
            </Card>
          )}
        </Transition>
        <IconButton
          // color={'neutral'}
          variant="solid"
          onClick={() =>
            setState({
              isOpen: !state.isOpen,
              ...(!state.isOpen
                ? {
                    hasOpenOnce: true,
                  }
                : {}),
            })
          }
          sx={(theme) => ({
            backgroundColor: state.config.primaryColor,
            width: '60px',
            height: '60px',
            borderRadius: '100%',
            color: textColor,
            transition: 'all 100ms ease-in-out',
            borderWidth: '0.5px',
            borderColor: theme.palette.divider,
            borderStyle: 'solid',
            p: '0',
            overflow: 'hidden',
            '&:hover': {
              backgroundColor: state.config.primaryColor,
              filter: 'brightness(0.9)',
              transform: 'scale(1.05)',
            },
          })}
        >
          {state.isOpen ? <ClearRoundedIcon /> : bubbleIcon}
        </IconButton>
      </Box>
    </>
  );
}

export default App;
